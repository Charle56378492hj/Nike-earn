import { logger } from "./logger";

export async function sendVerificationEmail(_email: string, _code: string): Promise<void> {
  logger.info("Verification email skipped by configuration");
}

export async function sendPasswordResetEmail(_email: string, _token: string): Promise<void> {
  logger.info("Password reset email skipped by configuration");
}
