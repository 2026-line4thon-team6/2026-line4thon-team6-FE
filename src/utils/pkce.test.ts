import { describe, expect, it } from 'vitest'
import { createCodeChallenge, createCodeVerifier, createState } from './pkce'

// OAuth PKCE (RFC 7636). API 명세: codeVerifier 43~128자 [A-Za-z0-9._~-], codeChallenge 43자 base64url(S256)
describe('PKCE', () => {
  it('codeVerifier는 매번 다른 43~128자 문자열이다', () => {
    const a = createCodeVerifier()
    const b = createCodeVerifier()

    expect(a).toMatch(/^[A-Za-z0-9._~-]{43,128}$/)
    expect(a).not.toBe(b)
  })

  it('codeChallenge는 verifier의 SHA-256을 base64url로 인코딩한 43자다 (RFC 7636 부록 B 예시)', async () => {
    const challenge = await createCodeChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')

    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })

  it('state는 추측하기 어려운 임의 문자열이다', () => {
    expect(createState()).toMatch(/^[A-Za-z0-9_-]{22,}$/)
    expect(createState()).not.toBe(createState())
  })
})
