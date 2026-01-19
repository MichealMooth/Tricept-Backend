import { describe, it, expect } from '@jest/globals'
import { hashPassword, comparePassword, generateSession } from './auth.service'

describe('auth.service', () => {
  it('hashPassword() - Passwort wird korrekt gehasht', async () => {
    const pw = 'SehrSicheresPW!123'
    const hashed = await hashPassword(pw)
    expect(hashed).toMatch(/\$2[aby]?\$/)
    expect(hashed).not.toEqual(pw)
  })

  it('comparePassword() - Vergleich funktioniert', async () => {
    const pw = 'NochEinPW!456'
    const hashed = await hashPassword(pw)
    const ok = await comparePassword(pw, hashed)
    expect(ok).toBe(true)
  })

  it('comparePassword() - Fehlschlag bei falschem Passwort', async () => {
    const pw = 'RichtigesPW!789'
    const hashed = await hashPassword(pw)
    const ok = await comparePassword('FalschesPW!000', hashed)
    expect(ok).toBe(false)
  })

  it('generateSession() - gibt nur sichere Felder zurück', () => {
    const session = generateSession({
      id: 'u1',
      email: 'user@example.com',
      firstName: 'Max',
      lastName: 'Muster',
      isAdmin: true,
    })
    expect(session).toEqual({
      id: 'u1',
      email: 'user@example.com',
      firstName: 'Max',
      lastName: 'Muster',
      isAdmin: true,
    })
  })
})
