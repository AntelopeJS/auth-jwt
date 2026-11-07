import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createServer, type AddressInfo, type Server } from "node:net";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import {
  equal,
  type App,
  type CallResult,
  type Check,
  type CommandResult,
  type JourneyContext,
} from "@antelopejs/tooling-configs/verify";

import { canonical, isString, parseJson, pick, recordOf, type Json } from "./json.ts";
import { ROUTES_SOURCE } from "./routes-source.ts";

export { pick, tuple, type Json } from "./json.ts";
export type ModuleConfig = NonNullable<NonNullable<Parameters<JourneyContext["fixture"]>[0]>["moduleConfig"]>;

export const SECRET = "verify-shared-secret";
export const OTHER_SECRET = "another-secret-the-module-does-not-hold";

export const BASE_CONFIG: ModuleConfig = { secret: SECRET };

const API_PACKAGE = "@antelopejs/api";
const API_VERSION = "2.0.0";
const CACHE_WAIT_MS = 180_000;
const ROUTES_INTERFACES = ["@antelopejs/interface-core", "@antelopejs/interface-api", "@antelopejs/interface-auth"];

export interface Session {
  context: JourneyContext;
  app: App;
  /** The origin the API module answers on. */
  base: string;
}

function isAddress(value: ReturnType<Server["address"]>): value is AddressInfo {
  return typeof value === "object" && value !== null;
}

/** A free loopback port, taken from the kernel. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = isAddress(address) ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

/** The ajs module cache every journey of a run shares, under the run's `work` so that `clean` removes it. */
function runCache(context: JourneyContext): string {
  return join(context.work, "..", "..", "ajs-cache");
}

function cacheHoldsApi(folder: string): boolean {
  const file = join(folder, "manifest.json");
  return existsSync(file) && pick(parseJson(readFileSync(file, "utf8")), API_PACKAGE) === API_VERSION;
}

/** Whether the process that wrote `lock` has exited, as when the harness exits on Ctrl+C without running the holder's release. */
function holderGone(lock: string, holder: string): boolean {
  const pid = Number(holder);
  if (!Number.isSafeInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return error instanceof Error && "code" in error && error.code === "ESRCH" && readLock(lock) === holder;
  }
}

function readLock(lock: string): string {
  try {
    return readFileSync(lock, "utf8");
  } catch {
    return "";
  }
}

/**
 * Picks the cache folder of one journey's project and returns it with the release to call once the app has loaded.
 * ajs deletes a module folder before it installs it, so only one journey at a time may install into the run's cache: the lock file holds its PID, and the others wait until ajs records the pinned API version, which it does after the install succeeds, or until the holder has exited.
 * A journey that waits longer than `CACHE_WAIT_MS` installs into a folder of its own instead.
 */
async function claimCache(context: JourneyContext): Promise<{ folder: string; release: () => void }> {
  const folder = runCache(context);
  const lock = `${folder}.lock`;
  const deadline = Date.now() + CACHE_WAIT_MS;
  while (Date.now() < deadline) {
    if (cacheHoldsApi(folder)) return { folder, release: () => {} };
    try {
      writeFileSync(lock, String(process.pid), { flag: "wx" });
      return { folder, release: () => rmSync(lock, { force: true }) };
    } catch (error) {
      if (!existsSync(lock)) throw error;
    }
    const holder = readLock(lock);
    if (holderGone(lock, holder)) rmSync(lock, { force: true });
    else await sleep(250);
  }
  return { folder: join(context.work, "ajs-cache"), release: () => {} };
}

/** Adds the API module from the registry and the routes consumer to the fixture project, the way the README tells a user to install them. */
function addApiAndRoutes(context: JourneyContext, project: string, port: number, cacheFolder: string): void {
  const file = join(project, "antelope.config.ts");
  const prefix = "export default ";
  const config = recordOf(parseJson(readFileSync(file, "utf8").trim().slice(prefix.length).replace(/;$/, "")));
  const routes = join(project, "routes");
  mkdirSync(join(routes, "node_modules/@antelopejs"), { recursive: true });
  for (const name of ROUTES_INTERFACES) symlinkSync(realpathSync(join(context.repo, "node_modules", name)), join(routes, "node_modules", name), "dir");
  context.edit("write the routes consumer manifest", join(routes, "package.json"), `${JSON.stringify({ name: "verify-routes", version: "1.0.0", main: "index.js" }, null, 2)}\n`);
  context.edit("write the routes consumer", join(routes, "index.js"), ROUTES_SOURCE);
  const api = {
    source: { type: "package", package: API_PACKAGE, version: API_VERSION },
    config: { servers: [{ protocol: "http", host: "127.0.0.1", port }] },
  };
  const extended = { ...config, cacheFolder, modules: { ...recordOf(config.modules), api, "verify-routes": { source: { type: "local", path: "./routes" } } } };
  context.edit("add the API module and the routes consumer", file, `${prefix}${JSON.stringify(extended, null, 2)};\n`);
}

/** Loads the module in `ajs project dev` with the given config next to the API module and the consumers, and hands it to `run`; the journey's cleanup stops the app afterwards. */
export async function withModule(
  context: JourneyContext,
  moduleConfig: ModuleConfig,
  run: (session: Session) => Promise<void>,
): Promise<void> {
  const port = await freePort();
  const project = context.fixture({ moduleConfig });
  const cache = await claimCache(context);
  let app: App;
  try {
    addApiAndRoutes(context, project, port, cache.folder);
    app = await context.dev("ajs project dev", project);
  } finally {
    cache.release();
  }
  await run({ context, app, base: `http://127.0.0.1:${port}` });
}

/** Runs `ajs project dev` on a project whose module config the module refuses, and returns how the process ended. */
export async function startRefused(context: JourneyContext, name: string, moduleConfig: ModuleConfig): Promise<CommandResult> {
  const project = context.fixture({ moduleConfig });
  const port = await freePort();
  const cache = await claimCache(context);
  try {
    addApiAndRoutes(context, project, port, cache.folder);
    const manifest = parseJson(readFileSync(join(context.repo, "node_modules/@antelopejs/core/package.json"), "utf8"));
    const bin = pick(manifest, "bin", "ajs");
    return await context.command(name, process.execPath, [join(context.repo, "node_modules/@antelopejs/core", isString(bin) ? bin : ""), "project", "dev"], {
      cwd: project,
      timeoutMs: 120_000,
    });
  } finally {
    cache.release();
  }
}

function callAuth(session: Session, name: string, path: string, args: Json[]): Promise<CallResult> {
  return session.context.call(name, session.app, { path: [path], args });
}

/** `SignRaw` of the auth interface through core. */
export function signRaw(session: Session, name: string, payload: Json, options?: Json): Promise<CallResult> {
  return callAuth(session, name, "SignRaw", options === undefined ? [payload] : [payload, options]);
}

/** `ValidateRaw` of the auth interface through core. */
export function validateRaw(session: Session, name: string, token?: Json, options?: Json): Promise<CallResult> {
  const args: Json[] = token === undefined ? [] : options === undefined ? [token] : [token, options];
  return callAuth(session, name, "ValidateRaw", args);
}

/** The token string a `SignRaw` call answered, or an empty string when it did not answer one. */
export function tokenOf(result: CallResult): string {
  return isString(result.value) ? result.value : "";
}

/** `equal` that ignores key order; an absent value reads as `null`. */
export function same(name: string, actual: Json | undefined, expected: Json): Check {
  return equal(name, canonical(actual), canonical(expected));
}

/** The call itself returned a value instead of throwing. */
export function resolved(result: CallResult): Check {
  return { name: "the call through core resolved", pass: result.ok, detail: result.ok ? "ok" : JSON.stringify(result.value) };
}

/** The call threw an error whose message is exactly `message`. */
export function rejectedWith(result: CallResult, message: string): Check {
  return same(`the call was refused with "${message}"`, result.ok ? "resolved" : pick(result.value, "message"), message);
}

/** What one HTTP request to the API module answered. */
export interface Reply {
  folder: string;
  status: number;
  headers: { [name: string]: string };
  body: string;
}

/** The status, lower-cased headers and body of a `curl -i` answer. */
function parseReply(result: CommandResult): Reply {
  const separator = result.stdout.indexOf("\r\n\r\n");
  const head = separator === -1 ? result.stdout : result.stdout.slice(0, separator);
  const lines = head.split("\r\n");
  const headers: { [name: string]: string } = {};
  for (const line of lines.slice(1)) {
    const colon = line.indexOf(":");
    if (colon > 0) headers[line.slice(0, colon).toLowerCase()] = line.slice(colon + 1).trim();
  }
  return {
    folder: result.folder,
    status: Number(/^HTTP\/\S+ (\d+)/.exec(lines[0] ?? "")?.[1] ?? 0),
    headers,
    body: separator === -1 ? "" : result.stdout.slice(separator + 4),
  };
}

/** Sends a request to the API module with curl, so the evidence holds the headers a client sees. */
export async function route(session: Session, name: string, path: string, init: { method?: string; headers?: { [name: string]: string } } = {}): Promise<Reply> {
  const headers = Object.entries(init.headers ?? {}).flatMap(([header, value]) => ["-H", `${header}: ${value}`]);
  const result = await session.context.command(name, "curl", ["-sS", "-i", "--max-time", "20", "-X", init.method ?? "GET", ...headers, `${session.base}${path}`]);
  return parseReply(result);
}

/** `GET /session/me` with the token in the `x-antelopejs-auth` header, or with no token at all. */
export function me(session: Session, name: string, token?: string): Promise<Reply> {
  return route(session, name, "/session/me", { headers: token === undefined ? {} : { "x-antelopejs-auth": token } });
}

/** The reply was refused: its status and body are exactly the given ones. */
export function refusedWith(reply: Reply, status: number, body: string): Check {
  return same(`the route answered ${status} ${body}`, [reply.status, reply.body], [status, body]);
}

/** The claims object a route answered, parsed from its JSON body; `null` when the body is not JSON. */
export function bodyJson(reply: Reply): Json {
  try {
    return parseJson(reply.body);
  } catch {
    return null;
  }
}

/** A numeric claim of a decoded token, or -1 when it is absent or not a number. */
export function claim(payload: Json | undefined, name: string): number {
  const value = pick(payload, name);
  return Number.isFinite(value) ? Number(value) : -1;
}
