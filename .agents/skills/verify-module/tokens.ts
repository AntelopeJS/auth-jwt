import { createHmac, createSign, createVerify, generateKeyPairSync } from "node:crypto";

import { parseJson, type Json } from "./json.ts";

/** A token taken apart without jsonwebtoken: the second view every journey reads the module's output through. */
export interface Decoded {
  header: Json;
  payload: Json;
  signingInput: string;
  signature: string;
  payloadText: string;
}

/** An RSA key pair as the PEM text the module's `signKey` and `verifyKey` files hold. */
export interface PemPair {
  privateKey: string;
  publicKey: string;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/** Splits a compact token into its parts and parses the header and, when it is JSON, the payload. */
export function decode(token: string): Decoded {
  const [header = "", payload = "", signature = ""] = token.split(".");
  const payloadText = Buffer.from(payload, "base64url").toString("utf8");
  let parsed: Json = payloadText;
  try {
    parsed = parseJson(payloadText);
  } catch {
    parsed = payloadText;
  }
  return {
    header: parseJson(Buffer.from(header, "base64url").toString("utf8")),
    payload: parsed,
    signingInput: `${header}.${payload}`,
    signature,
    payloadText,
  };
}

/** Signs `payloadText` as the payload of a token with the given header, using HMAC-SHA256 written out here, not jsonwebtoken. */
export function hs256(secret: string, payloadText: string, header: Json = { alg: "HS256", typ: "JWT" }): string {
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(payloadText)}`;
  return `${signingInput}.${createHmac("sha256", secret).update(signingInput).digest("base64url")}`;
}

/** A token whose claims are the given object, signed with HMAC-SHA256 by this file. */
export function hs256Claims(secret: string, claims: Json): string {
  return hs256(secret, JSON.stringify(claims));
}

/** Whether the token's signature is the HMAC-SHA256 of its first two segments under `secret`. */
export function hmacHolds(token: string, secret: string): boolean {
  const { signingInput, signature } = decode(token);
  return createHmac("sha256", secret).update(signingInput).digest("base64url") === signature;
}

/** A token with the given claims signed with RSASSA-PKCS1-v1_5 and SHA-256 by this file. */
export function rs256Claims(privateKey: string, claims: Json): string {
  const signingInput = `${base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${base64url(JSON.stringify(claims))}`;
  return `${signingInput}.${createSign("RSA-SHA256").update(signingInput).sign(privateKey, "base64url")}`;
}

/** Whether the token's signature verifies under `publicKey` as RSASSA-PKCS1-v1_5 with SHA-256. */
export function rsaHolds(token: string, publicKey: string): boolean {
  const { signingInput, signature } = decode(token);
  return createVerify("RSA-SHA256").update(signingInput).verify(publicKey, signature, "base64url");
}

export function newPemPair(): PemPair {
  const pair = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" },
  });
  return { privateKey: pair.privateKey, publicKey: pair.publicKey };
}
