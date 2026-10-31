import { join } from "node:path";

import type { Journey, JourneyContext } from "@antelopejs/tooling-configs/verify";

import { claim, me, refusedWith, resolved, same, signRaw, tokenOf, validateRaw, withModule, type ModuleConfig } from "./session.ts";
import { decode, hs256, newPemPair, rs256Claims, rsaHolds, type PemPair } from "./tokens.ts";

interface Keys {
  pair: PemPair;
  config: ModuleConfig;
}

/** Writes a fresh RSA pair to the files the module reads at startup and returns the config that names them. */
function writeKeys(context: JourneyContext): Keys {
  const pair = newPemPair();
  const signKey = join(context.work, "keys/private.pem");
  const verifyKey = join(context.work, "keys/public.pem");
  context.edit("write the private key", signKey, pair.privateKey);
  context.edit("write the public key", verifyKey, pair.publicKey);
  return {
    pair,
    config: { signKey, verifyKey, signOptions: { algorithm: "RS256" }, verifyOptions: { algorithms: ["RS256"] } },
  };
}

const rs256Roundtrip: Journey = {
  title: "with signKey and verifyKey files the module signs RS256 tokens the public key verifies, and validates them back",
  entryPoint: "`config: { signKey, verifyKey, signOptions: { algorithm: \"RS256\" } }`, then `SignRaw` and `ValidateRaw` through core and `@Authentication()` over HTTP",
  async run(context) {
    const keys = writeKeys(context);
    await withModule(context, keys.config, async (session) => {
      const signed = await signRaw(session, "sign an object", { userId: 42 }, { expiresIn: "1h" });
      const token = tokenOf(signed);
      const decoded = decode(token);
      context.expect(signed.folder, [
        resolved(signed),
        same("the header names RS256", decoded.header, { alg: "RS256", typ: "JWT" }),
        { name: "the public key file verifies the signature", pass: rsaHolds(token, keys.pair.publicKey), detail: token },
        same("the claims are the ones signed", claim(decoded.payload, "exp") - claim(decoded.payload, "iat"), 3600),
      ]);
      const validated = await validateRaw(session, "validate the token", token);
      context.expect(validated.folder, [resolved(validated), same("the claims come back", validated.value, decoded.payload)]);
      const route = await me(session, "use the token on the route", token);
      context.expect(route.folder, [same("the protected route accepts it", route.status, 200)]);
    });
  },
};

const foreignKey: Journey = {
  title: "an RS256 token signed with another private key is refused 403 invalid signature",
  entryPoint: "`@Authentication()` over HTTP with a token signed by a key the module does not hold",
  async run(context) {
    const keys = writeKeys(context);
    await withModule(context, keys.config, async (session) => {
      const stranger = rs256Claims(newPemPair().privateKey, { userId: "42" });
      const refused = await me(session, "token of a foreign key", stranger);
      context.expect(refused.folder, [refusedWith(refused, 403, "Forbidden (invalid signature)")]);
      const own = await me(session, "token of the module's key", rs256Claims(keys.pair.privateKey, { userId: "42" }));
      context.expect(own.folder, [same("a token signed with the module's private key is accepted", own.status, 200)]);
    });
  },
};

const algorithmConfusion: Journey = {
  title: "an HS256 token keyed with the public key's own text is refused, so the public key cannot sign",
  entryPoint: "`@Authentication()` over HTTP with an HS256 token whose secret is the public key file",
  async run(context) {
    const keys = writeKeys(context);
    await withModule(context, keys.config, async (session) => {
      const forged = hs256(keys.pair.publicKey, JSON.stringify({ userId: "42" }));
      const refused = await me(session, "HS256 token keyed with the public key", forged);
      context.expect(refused.folder, [refusedWith(refused, 403, "Forbidden (invalid algorithm)")]);
    });
  },
};

export const keypairJourneys = {
  "rs256-roundtrip": rs256Roundtrip,
  "foreign-key": foreignKey,
  "algorithm-confusion": algorithmConfusion,
};
