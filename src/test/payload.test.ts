import assert from "node:assert";
import { createHmac } from "node:crypto";
import { HTTPResult } from "@antelopejs/interface-api";
import { JWTHandler } from "../jwt";

const SECRET = "test-secret-key-for-jwt";
const FORBIDDEN_STATUS = 403;

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function signRaw(payload: string): string {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const signingInput = `${header}.${base64Url(payload)}`;
  const signature = createHmac("sha256", SECRET)
    .update(signingInput)
    .digest("base64url");
  return `${signingInput}.${signature}`;
}

function assertForbidden(message?: string): (error: HTTPResult) => boolean {
  return (error) => {
    assert.ok(error instanceof HTTPResult);
    assert.strictEqual(error.getStatus(), FORBIDDEN_STATUS);
    if (message !== undefined) {
      assert.strictEqual(error.getBody(), message);
    }
    return true;
  };
}

describe("JWTHandler.verify payloads", () => {
  const handler = new JWTHandler({ secret: SECRET });

  it("resolves the claims object of a token it signed", async () => {
    const token = await handler.sign({ userId: 123, role: "admin" });

    const claims = await handler.verify(token);

    assert.ok(claims instanceof Object);
    assert.strictEqual(claims["userId"], 123);
    assert.strictEqual(claims["role"], "admin");
  });

  it("resolves a string payload as the string", async () => {
    const token = await handler.sign("plain-data");

    assert.strictEqual(await handler.verify(token), "plain-data");
  });

  it("answers 403 for a validly signed JSON array payload", async () => {
    const token = signRaw(JSON.stringify([1, 2]));

    await assert.rejects(
      handler.verify(token),
      assertForbidden("Forbidden (the payload is not a JSON object)"),
    );
  });

  it("answers 403 for a token signed with another secret", async () => {
    const token = await new JWTHandler({ secret: "other-secret" }).sign({
      userId: 1,
    });

    await assert.rejects(handler.verify(token), assertForbidden());
  });
});
