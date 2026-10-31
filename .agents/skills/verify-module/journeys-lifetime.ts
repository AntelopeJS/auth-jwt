import type { Journey } from "@antelopejs/tooling-configs/verify";

import { BASE_CONFIG, SECRET, claim, me, refusedWith, resolved, same, signRaw, tokenOf, validateRaw, withModule } from "./session.ts";
import { decode, hs256Claims, nowSeconds } from "./tokens.ts";

const expiresIn: Journey = {
  title: "expiresIn as a timespan or as seconds sets exp that far after iat, and the token validates",
  entryPoint: "`SignRaw(claims, { expiresIn })` through core, the token taken apart with node:crypto",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const lifetimes = [
        ["1h", 3600],
        ["2d", 172_800],
        [90, 90],
      ] as const;
      for (const [expiresInValue, seconds] of lifetimes) {
        const signed = await signRaw(session, `sign for ${expiresInValue}`, { userId: 42 }, { expiresIn: expiresInValue });
        const decoded = decode(tokenOf(signed));
        const validated = await validateRaw(session, `validate the ${expiresInValue} token`, tokenOf(signed));
        context.expect(validated.folder, [
          resolved(signed),
          same(`exp is ${seconds} seconds after iat`, claim(decoded.payload, "exp") - claim(decoded.payload, "iat"), seconds),
          resolved(validated),
        ]);
      }
    });
  },
};

const notBefore: Journey = {
  title: "notBefore sets nbf that far after iat, the route refuses the token as not active, and ignoreNotBefore lets it through",
  entryPoint: "`SignRaw(claims, { notBefore })`, then `@Authentication()` over HTTP and `ValidateRaw(token, { ignoreNotBefore })` through core",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const signed = await signRaw(session, "sign for later", { userId: 42 }, { notBefore: "1h" });
      const token = tokenOf(signed);
      const decoded = decode(token);
      context.expect(signed.folder, [resolved(signed), same("nbf is an hour after iat", claim(decoded.payload, "nbf") - claim(decoded.payload, "iat"), 3600)]);
      const early = await me(session, "use the token now", token);
      context.expect(early.folder, [refusedWith(early, 403, "Forbidden (jwt not active)")]);
      const refused = await validateRaw(session, "validate without options", token);
      const ignored = await validateRaw(session, "validate ignoring notBefore", token, { ignoreNotBefore: true });
      context.expect(ignored.folder, [same("the interface refuses the token as it stands", refused.ok, false), resolved(ignored), same("the claims come back", ignored.value, decoded.payload)]);
    });
  },
};

const expiredToken: Journey = {
  title: "a token past its exp is refused with 403 jwt expired, and ignoreExpiration lets it through",
  entryPoint: "`@Authentication()` over HTTP and `ValidateRaw(token, { ignoreExpiration })` through core with a token that expired a minute ago",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const issued = nowSeconds() - 3600;
      const token = hs256Claims(SECRET, { userId: "42", iat: issued, exp: issued + 3540 });
      const late = await me(session, "use the expired token", token);
      context.expect(late.folder, [refusedWith(late, 403, "Forbidden (jwt expired)")]);
      const refused = await validateRaw(session, "validate without options", token);
      const ignored = await validateRaw(session, "validate ignoring expiration", token, { ignoreExpiration: true });
      context.expect(ignored.folder, [same("the interface refuses the token as it stands", refused.ok, false), resolved(ignored), same("the claims come back", ignored.value, decode(token).payload)]);
    });
  },
};

const maxAge: Journey = {
  title: "maxAge refuses a token issued longer ago than the limit, whatever its exp, and accepts it under a larger limit",
  entryPoint: "`ValidateRaw(token, { maxAge })` through core with a token issued two hours ago and no exp",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const token = hs256Claims(SECRET, { userId: "42", iat: nowSeconds() - 7200 });
      const open = await validateRaw(session, "validate without maxAge", token);
      const strict = await validateRaw(session, "validate with maxAge 1h", token, { maxAge: "1h" });
      const lax = await validateRaw(session, "validate with maxAge 3h", token, { maxAge: "3h" });
      context.expect(lax.folder, [
        same("a token with no exp validates without a limit", open.ok, true),
        same("maxAge 1h refuses a token issued two hours ago", strict.ok, false),
        same("maxAge 3h accepts it", lax.ok, true),
      ]);
    });
  },
};

export const lifetimeJourneys = {
  "expires-in": expiresIn,
  "not-before": notBefore,
  "expired-token": expiredToken,
  "max-age": maxAge,
};
