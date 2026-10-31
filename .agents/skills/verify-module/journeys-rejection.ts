import type { Journey } from "@antelopejs/tooling-configs/verify";

import { BASE_CONFIG, OTHER_SECRET, SECRET, me, refusedWith, same, signRaw, tokenOf, withModule } from "./session.ts";
import { base64url, hs256, hs256Claims } from "./tokens.ts";

const missingToken: Journey = {
  title: "a protected route answers 401 Unauthorized when the request carries no token",
  entryPoint: "`@Authentication()` route called with no `x-antelopejs-auth` header and no cookie, over HTTP",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const none = await me(session, "no token");
      context.expect(none.folder, [refusedWith(none, 401, "Unauthorized")]);
    });
  },
};

const badSignature: Journey = {
  title: "a token signed with another secret, a token whose claims were edited and an unsigned token are all answered 403",
  entryPoint: "`@Authentication()` route called with forged tokens, over HTTP",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const foreign = await me(session, "token of another secret", hs256Claims(OTHER_SECRET, { userId: "42" }));
      context.expect(foreign.folder, [refusedWith(foreign, 403, "Forbidden (invalid signature)")]);
      const signed = tokenOf(await signRaw(session, "sign a token", { userId: "42", role: "user" }));
      const parts = signed.split(".");
      const edited = `${parts[0]}.${base64url(JSON.stringify({ userId: "42", role: "admin" }))}.${parts[2]}`;
      const tampered = await me(session, "token with edited claims", edited);
      context.expect(tampered.folder, [refusedWith(tampered, 403, "Forbidden (invalid signature)")]);
      const unsigned = await me(session, "unsigned token", `${base64url(JSON.stringify({ alg: "none", typ: "JWT" }))}.${base64url(JSON.stringify({ userId: "42" }))}.`);
      context.expect(unsigned.folder, [refusedWith(unsigned, 403, "Forbidden (jwt signature is required)")]);
      const downgraded = await me(session, "token of another algorithm", hs256(SECRET, JSON.stringify({ userId: "42" }), { alg: "HS384", typ: "JWT" }));
      context.expect(downgraded.folder, [refusedWith(downgraded, 403, "Forbidden (invalid signature)")]);
    });
  },
};

const malformedToken: Journey = {
  title: "text that is not a compact token is answered 403 and never reaches the route",
  entryPoint: "`@Authentication()` route called with garbage in the auth header, over HTTP",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const words = await me(session, "words", "not-a-token");
      context.expect(words.folder, [refusedWith(words, 403, "Forbidden (jwt malformed)")]);
      const truncated = await me(session, "truncated token", hs256Claims(SECRET, { userId: "42" }).split(".").slice(0, 2).join("."));
      context.expect(truncated.folder, [refusedWith(truncated, 403, "Forbidden (jwt malformed)")]);
    });
  },
};

const nonObjectPayload: Journey = {
  title: "a correctly signed token whose payload is a JSON array is answered 403, while a plain string the module signed is accepted",
  entryPoint: "`@Authentication()` route called with tokens signed by the shared secret whose payloads are not objects, over HTTP",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const array = await me(session, "array payload", hs256(SECRET, JSON.stringify([1, 2])));
      context.expect(array.folder, [refusedWith(array, 403, "Forbidden (the payload is not a JSON object)")]);
      const text = await me(session, "string payload", tokenOf(await signRaw(session, "sign a string", "plain-text")));
      context.expect(text.folder, [same("the route answered 200 with the string", [text.status, text.body], [200, "plain-text"])]);
    });
  },
};

export const rejectionJourneys = {
  "missing-token": missingToken,
  "bad-signature": badSignature,
  "malformed-token": malformedToken,
  "non-object-payload": nonObjectPayload,
};
