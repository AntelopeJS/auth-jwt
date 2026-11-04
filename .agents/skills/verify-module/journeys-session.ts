import type { Journey } from "@antelopejs/tooling-configs/verify";

import { BASE_CONFIG, SECRET, bodyJson, claim, pick, refusedWith, route, same, withModule } from "./session.ts";
import { decode, hmacHolds } from "./tokens.ts";

const COOKIE_TOKEN = /^ANTELOPEJS_AUTH=([^;]+)(.*)$/;

const loginThenMe: Journey = {
  title: "POST /session/login sets the auth cookie, and GET /session/me with that cookie answers the claims that were signed",
  entryPoint: "the README quick start: `SignServerResponse` in a login route and `@Authentication()` on a protected route, over HTTP",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const login = await route(session, "login", "/session/login", { method: "POST" });
      const cookie = COOKIE_TOKEN.exec(login.headers["set-cookie"] ?? "");
      const token = cookie?.[1] ?? "";
      const decoded = decode(token);
      context.expect(login.folder, [
        same("the login route answered 200 ok", [login.status, bodyJson(login)], [200, { ok: true }]),
        same("the cookie carries the signing options of the route", cookie?.[2] ?? null, "; httpOnly; path=/"),
        { name: "the cookie holds an HS256 token the secret signs", pass: hmacHolds(token, SECRET), detail: token },
        same("the claims are the ones the route signed", pick(decoded.payload, "userId"), "42"),
        same("the token lives for the hour the route asked", claim(decoded.payload, "exp") - claim(decoded.payload, "iat"), 3600),
      ]);
      const byCookie = await route(session, "me with the cookie", "/session/me", { headers: { cookie: `ANTELOPEJS_AUTH=${token}` } });
      context.expect(byCookie.folder, [same("the protected route read the claims from the cookie", [byCookie.status, bodyJson(byCookie)], [200, decoded.payload])]);
      const byHeader = await route(session, "me with the header", "/session/me", { headers: { "x-antelopejs-auth": token } });
      context.expect(byHeader.folder, [same("the protected route read the claims from the header", [byHeader.status, bodyJson(byHeader)], [200, decoded.payload])]);
      const refused = await route(session, "me without a token", "/session/me");
      context.expect(refused.folder, [refusedWith(refused, 401, "Unauthorized")]);
    });
  },
};

export const sessionJourneys = {
  "login-then-me": loginThenMe,
};
