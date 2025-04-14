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
  const expectedSecret = process.env.NEXT_PUBLIC_VAPI_WEBHOOK_SECRET

  if (!expectedSecret) {
    console.error('VAPI webhook secret not configured')
    return false
  }

  return verifyVAPISecret(secret, expectedSecret)
} 