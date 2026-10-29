import { Logging } from "@antelopejs/interface-core/logging";
import {
  type AuthClaims,
  SignRaw,
  ValidateRaw,
} from "@antelopejs/interface-auth";

function isClaimsObject(
  claims: AuthClaims,
): claims is Exclude<AuthClaims, string> {
  return typeof claims !== "string";
}

export function construct(config: unknown): void {
  Logging.Debug(
    "Auth-JWT module playground initialized with config:" +
      JSON.stringify(config),
  );
}

export function destroy(): void {}

export async function start(): Promise<void> {
  try {
    const testData = {
      userId: 123,
      role: "admin",
      timestamp: new Date().toISOString(),
    };

    Logging.Debug("Test data:", JSON.stringify(testData));

    const token = await SignRaw(testData, {
      expiresIn: "1h",
    });

    Logging.Debug("Generated JWT token:", token);

    const validatedData = await ValidateRaw(token);

    Logging.Debug("Validated token data:", JSON.stringify(validatedData));

    if (
      isClaimsObject(validatedData) &&
      validatedData.userId === testData.userId &&
      validatedData.role === testData.role
    ) {
      Logging.Debug("✅ Token validation successful!");
    } else {
      Logging.Debug("❌ Token validation failed - data mismatch");
    }

    try {
      const invalidToken = `${token}invalid`;
      await ValidateRaw(invalidToken);
      Logging.Debug(
        "❌ Invalid token test failed - should have thrown an error",
      );
    } catch (error: any) {
      Logging.Debug("✅ Invalid token correctly rejected:", error.message);
    }
  } catch (error: any) {
    Logging.Debug("❌ Test failed with error:", error.message);
  }
}

export function stop(): void {}
