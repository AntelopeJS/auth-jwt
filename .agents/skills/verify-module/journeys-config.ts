import { join } from "node:path";

import { exitIs, has, type Journey } from "@antelopejs/tooling-configs/verify";

import { SECRET, claim, me, resolved, same, signRaw, startRefused, tokenOf, validateRaw, withModule } from "./session.ts";
import { decode, hmacHolds, hs256Claims, nowSeconds } from "./tokens.ts";

const noCredentials: Journey = {
  title: "with no secret, or a signKey without a verifyKey, the module fails to construct and the project exits 1 saying the config is invalid",
  entryPoint: "`ajs project dev` with `config: {}` and with `config: { signKey }`",
  async run(context) {
    const empty = await startRefused(context, "start with an empty config", {});
    context.expect(empty.folder, [exitIs(empty, 1), has("the failure names the module's error", empty.stdout + empty.stderr, /Error: Invalid JWT config/)]);
    const half = await startRefused(context, "start with a signKey only", { signKey: join(context.work, "keys/private.pem") });
    context.expect(half.folder, [exitIs(half, 1), has("the failure names the module's error", half.stdout + half.stderr, /Error: Invalid JWT config/)]);
  },
};

const unreadableKey: Journey = {
  title: "a signKey or verifyKey that names no file stops the project at startup with the file error, not at the first request",
  entryPoint: "`ajs project dev` with `config: { signKey, verifyKey }` pointing at files that do not exist",
  async run(context) {
    const signKey = join(context.work, "keys/missing-private.pem");
    const started = await startRefused(context, "start with missing key files", { signKey, verifyKey: join(context.work, "keys/missing-public.pem") });
    context.expect(started.folder, [exitIs(started, 1), has("the failure names a missing key file", started.stdout + started.stderr, /ENOENT: no such file or directory, open '[^']*missing-(?:private|public)\.pem'/)]);
  },
};

const secretWins: Journey = {
  title: "when secret and key files are both configured the secret signs and verifies, and the key files are never read",
  entryPoint: "`config: { secret, signKey, verifyKey }` with key files that do not exist",
  async run(context) {
    const config = { secret: SECRET, signKey: join(context.work, "keys/missing-private.pem"), verifyKey: join(context.work, "keys/missing-public.pem") };
    await withModule(context, config, async (session) => {
      const signed = await signRaw(session, "sign an object", { userId: 42 });
      const token = tokenOf(signed);
      const validated = await validateRaw(session, "validate the token", token);
      context.expect(validated.folder, [
        resolved(signed),
        same("the header names HS256", decode(token).header, { alg: "HS256", typ: "JWT" }),
        { name: "the secret signed the token", pass: hmacHolds(token, SECRET), detail: token },
        resolved(validated),
      ]);
    });
  },
};

const defaultSignOptions: Journey = {
  title: "signOptions in the config apply to every token, and a SignRaw option replaces the configured one",
  entryPoint: "`config: { secret, signOptions: { expiresIn: \"2h\" } }`, then `SignRaw` with and without `expiresIn`",
  async run(context) {
    await withModule(context, { secret: SECRET, signOptions: { expiresIn: "2h" } }, async (session) => {
      const configured = await signRaw(session, "sign with the configured lifetime", { userId: 42 });
      const configuredClaims = decode(tokenOf(configured)).payload;
      const overridden = await signRaw(session, "sign with a lifetime of its own", { userId: 42 }, { expiresIn: "10m" });
      const overriddenClaims = decode(tokenOf(overridden)).payload;
      context.expect(overridden.folder, [
        resolved(configured),
        same("a token signed with no option lives the configured two hours", claim(configuredClaims, "exp") - claim(configuredClaims, "iat"), 7200),
        resolved(overridden),
        same("the SignRaw option wins over the configured one", claim(overriddenClaims, "exp") - claim(overriddenClaims, "iat"), 600),
      ]);
    });
  },
};

const defaultVerifyOptions: Journey = {
  title: "verifyOptions in the config apply to every validation, and a ValidateRaw option replaces the configured one",
  entryPoint: "`config: { secret, verifyOptions: { ignoreExpiration: true } }`, then `ValidateRaw` and `@Authentication()` with an expired token",
  async run(context) {
    await withModule(context, { secret: SECRET, verifyOptions: { ignoreExpiration: true } }, async (session) => {
      const issued = nowSeconds() - 3600;
      const token = hs256Claims(SECRET, { userId: "42", iat: issued, exp: issued + 60 });
      const configured = await validateRaw(session, "validate with the configured options", token);
      const overridden = await validateRaw(session, "validate with its own options", token, { ignoreExpiration: false });
      const route = await me(session, "use the expired token on the route", token);
      context.expect(route.folder, [
        same("the configured ignoreExpiration lets the expired token through", configured.ok, true),
        same("the ValidateRaw option wins over the configured one", overridden.ok, false),
        same("the protected route applies the configured options", route.status, 200),
      ]);
    });
  },
};

export const configJourneys = {
  "no-credentials": noCredentials,
  "unreadable-key": unreadableKey,
  "secret-wins": secretWins,
  "default-sign-options": defaultSignOptions,
  "default-verify-options": defaultVerifyOptions,
};
