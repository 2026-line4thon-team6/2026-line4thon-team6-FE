// OAuth PKCE (RFC 7636) · state 생성. 로그인 세션마다 새로 만든다

function base64Url(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function randomString(byteLength: number) {
  return base64Url(crypto.getRandomValues(new Uint8Array(byteLength)))
}

// 64바이트 → 86자 (허용 43~128자)
export function createCodeVerifier() {
  return randomString(64)
}

// S256: base64url(SHA-256(verifier)) → 43자
export async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64Url(new Uint8Array(digest))
}

export function createState() {
  return randomString(24)
}
