import assert from "node:assert";
import { JWTHandler, type JWTHandlerConfig } from "../jwt";

const INVALID_CONFIG = /^Error: Invalid JWT config$/;

describe("JWTHandler config", () => {
  const rejected: [string, JWTHandlerConfig][] = [
    ["an empty secret", { secret: "" }],
    ["an empty sign key path", { signKey: "", verifyKey: "verify.pem" }],
    ["an empty verify key path", { signKey: "sign.pem", verifyKey: "" }],
  ];

  for (const [name, config] of rejected) {
    it(`throws Invalid JWT config for ${name}`, () => {
      assert.throws(() => new JWTHandler(config), INVALID_CONFIG);
    });
  }

  it("uses the key pair when the secret is empty", async () => {
    const handler = new JWTHandler({
      secret: "",
      signKey: "missing-sign.pem",
      verifyKey: "missing-verify.pem",
    });

    await assert.rejects(handler.loadKeys(), { code: "ENOENT" });
  });
});
