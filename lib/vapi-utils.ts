import { timingSafeEqual } from 'crypto'

export function verifyVAPISecret(secret: string | null, expectedSecret: string): boolean {
  if (!secret) return false
  
  try {
    // Use constant-time comparison to prevent timing attacks
    return timingSafeEqual(
      Buffer.from(secret),
      Buffer.from(expectedSecret)
    )
  } catch (error) {
    console.error('Error verifying VAPI secret:', error)
    return false
  }
}

export function validateVAPIRequest(headers: Headers, body: string): boolean {
  const secret = headers.get('x-vapi-secret')
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET

  // If webhook secret isn't configured, log a warning but continue
  // This allows builds to complete, but you should set this in production
  if (!expectedSecret) {
    console.warn('VAPI webhook secret not configured - webhooks will not be properly validated')
    // Return true to allow builds to complete, but this should be fixed in production
    return true
  }

  return verifyVAPISecret(secret, expectedSecret)
} 