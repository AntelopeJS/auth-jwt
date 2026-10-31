import type { Journey } from "@antelopejs/tooling-configs/verify";

import { BASE_CONFIG, SECRET, claim, pick, resolved, same, signRaw, tokenOf, tuple, validateRaw, withModule } from "./session.ts";
import { decode, hmacHolds, nowSeconds } from "./tokens.ts";

const secretRoundtrip: Journey = {
  title: "an object signed with the shared secret is an HS256 token another implementation can recompute, and validating it returns the claims",
  entryPoint: "`SignRaw` then `ValidateRaw` of the auth interface through core, the token taken apart with node:crypto",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const signed = await signRaw(session, "sign an object", { userId: 42, role: "admin" });
      const token = tokenOf(signed);
      const decoded = decode(token);
      context.expect(signed.folder, [
        resolved(signed),
        same("the header names HS256 and the JWT type", decoded.header, { alg: "HS256", typ: "JWT" }),
        same("the claims are the ones signed", tuple(pick(decoded.payload, "userId"), pick(decoded.payload, "role")), [42, "admin"]),
        { name: "iat is the time of signing", pass: Math.abs(claim(decoded.payload, "iat") - nowSeconds()) < 60, detail: `iat ${claim(decoded.payload, "iat")}` },
        { name: "the signature is the HMAC-SHA256 of the secret over the first two segments", pass: hmacHolds(token, SECRET), detail: token.split(".")[2] ?? "" },
      ]);
      const validated = await validateRaw(session, "validate the token", token);
      context.expect(validated.folder, [resolved(validated), same("the claims come back as signed", validated.value, decoded.payload)]);
    });
  },
};

const stringPayload: Journey = {
  title: "a string signed with the secret is carried as the token's payload text and validates back to the same string",
  entryPoint: "`SignRaw` and `ValidateRaw` with a string payload through core",
  async run(context) {
    await withModule(context, BASE_CONFIG, async (session) => {
      const signed = await signRaw(session, "sign a string", "plain-text");
      const token = tokenOf(signed);
      context.expect(signed.folder, [
        resolved(signed),
        same("the payload segment is the string itself", decode(token).payloadText, "plain-text"),
        { name: "the signature is the HMAC-SHA256 of the secret", pass: hmacHolds(token, SECRET), detail: token },
      ]);
      const validated = await validateRaw(session, "validate the string token", token);
      context.expect(validated.folder, [resolved(validated), same("the string comes back", validated.value, "plain-text")]);
    });
  },
};

export const secretJourneys = {
  "secret-roundtrip": secretRoundtrip,
  "string-payload": stringPayload,
};
