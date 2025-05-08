import { Logging } from '@ajs/logging/beta';
import { SignRaw, ValidateRaw } from '@ajs/auth/beta';

export function construct(config: unknown): void {
  // Set things up when module is loaded
  Logging.Debug('Auth-JWT module playground initialized with config:' + JSON.stringify(config));
}

export function destroy(): void {}

export async function start(): Promise<void> {
  try {
    // Sample data to sign
    const testData = {
      userId: 123,
      role: 'admin',
      timestamp: new Date().toISOString(),
    };

    Logging.Debug('Test data:', JSON.stringify(testData));

    // Sign the data to create a JWT token
    const token = await SignRaw(testData, {
      expiresIn: '1h', // Token expires in 1 hour
    });

    Logging.Debug('Generated JWT token:', token);

    // Validate the token and retrieve the data
    const validatedData = await ValidateRaw(token);

    Logging.Debug('Validated token data:', JSON.stringify(validatedData));

    // Verify the data matches
    if (validatedData.userId === testData.userId && validatedData.role === testData.role) {
      Logging.Debug('✅ Token validation successful!');
    } else {
      Logging.Debug('❌ Token validation failed - data mismatch');
    }

    // Test with invalid token
    try {
      const invalidToken = token + 'invalid';
      await ValidateRaw(invalidToken);
      Logging.Debug('❌ Invalid token test failed - should have thrown an error');
    } catch (error: any) {
      Logging.Debug('✅ Invalid token correctly rejected:', error.message);
    }
  } catch (error: any) {
    Logging.Debug('❌ Test failed with error:', error.message);
  }
}

export function stop(): void {}
