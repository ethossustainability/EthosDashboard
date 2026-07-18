/**
 * lib/auth.ts
 * Shared JWT utility for API routes.
 */
import type { JwtClaims } from '@/types/auth';

/**
 * Decodes custom claims from a verified Supabase JWT.
 * Must only be called after supabaseAdmin.auth.getUser(token) confirms the token is valid.
 * Returns null if the payload cannot be parsed.
 */
export function extractClaims(token: string): JwtClaims | null {
  try {
    const payloadStr = Buffer.from(token.split('.')[1], 'base64').toString('utf8');
    return JSON.parse(payloadStr) as JwtClaims;
  } catch {
    return null;
  }
}
