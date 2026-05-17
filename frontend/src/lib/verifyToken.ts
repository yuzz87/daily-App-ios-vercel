import { createHmac, timingSafeEqual } from "node:crypto"

export function verifyRailsJwt(authHeader: string | null): boolean {
  if (!authHeader) return false
  const secret = process.env.DEVISE_JWT_SECRET_KEY
  if (!secret) throw new Error("DEVISE_JWT_SECRET_KEY is not set")

  const rawToken = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader

  const parts = rawToken.split(".")
  if (parts.length !== 3) return false

  const [headerB64, payloadB64, signatureB64] = parts
  const signingInput = `${headerB64}.${payloadB64}`

  const expectedSig = createHmac("sha256", secret)
    .update(signingInput)
    .digest("base64url")

  try {
    if (!timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signatureB64))) {
      return false
    }
  } catch {
    return false
  }

  const payload = JSON.parse(
    Buffer.from(payloadB64, "base64url").toString("utf-8"),
  )
  if (typeof payload.exp === "number" && payload.exp < Math.floor(Date.now() / 1000)) {
    return false
  }

  return true
}
