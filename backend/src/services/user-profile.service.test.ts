import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock prisma client
const mPrisma = {
  userProfile: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
}

jest.mock('@/config/database', () => ({ prisma: mPrisma }))

import { getUserProfile, createUserProfile, updateUserProfile } from '@/services/user-profile.service'

beforeEach(() => {
  jest.clearAllMocks()
})

describe('user-profile.service (mocked prisma)', () => {
  it('getUserProfile returns null when not found and parses JSON fields safely', async () => {
    mPrisma.userProfile.findUnique.mockResolvedValueOnce(null)
    const missing = await getUserProfile('u1')
    expect(missing).toBeNull()

    // malformed JSON in row should be handled by fallbacks
    mPrisma.userProfile.findUnique.mockResolvedValueOnce({
      userId: 'u1',
      firstName: 'A',
      lastName: 'B',
      roleTitle: 'R',
      mainFocus: 'F',
      projectReferences: '{malformed}',
      experience: null,
      certifications: null,
      tools: '{malformed}',
      methods: '{malformed}',
      softSkills: '{malformed}',
      education: null,
      profileImageUrl: null,
    })
    const parsed = await getUserProfile('u1')
    expect(parsed?.projectReferences).toEqual({ current: '', past: '' })
    expect(parsed?.tools).toEqual([])
    expect(parsed?.methods).toEqual([])
    expect(parsed?.softSkills).toEqual([])
  })

  it('createUserProfile stringifies arrays/objects and applies defaults', async () => {
    mPrisma.userProfile.create.mockResolvedValueOnce({
      userId: 'u1',
      firstName: 'A',
      lastName: 'B',
      roleTitle: 'R',
      mainFocus: 'F',
      projectReferences: JSON.stringify({ current: 'c', past: 'p' }),
      experience: '',
      certifications: '',
      tools: JSON.stringify(['t1']),
      methods: JSON.stringify(['m1']),
      softSkills: JSON.stringify(['s1']),
      education: '',
      profileImageUrl: '',
    })
    const res = await createUserProfile('u1', {
      firstName: 'A',
      lastName: 'B',
      roleTitle: 'R',
      mainFocus: 'F',
      projectReferences: { current: 'c', past: 'p' },
      tools: ['t1'],
      methods: ['m1'],
      softSkills: ['s1'],
    })
    expect(res?.projectReferences).toEqual({ current: 'c', past: 'p' })
    expect(res?.tools).toEqual(['t1'])
  })

  it('updateUserProfile only applies provided fields (partial) and parses back', async () => {
    mPrisma.userProfile.update.mockResolvedValueOnce({
      userId: 'u1',
      firstName: 'Z', // updated
      lastName: 'B', // unchanged
      roleTitle: 'R',
      mainFocus: 'F',
      projectReferences: JSON.stringify({ current: '', past: '' }),
      experience: '',
      certifications: '',
      tools: JSON.stringify([]),
      methods: JSON.stringify([]),
      softSkills: JSON.stringify([]),
      education: '',
      profileImageUrl: '',
    })
    const res = await updateUserProfile('u1', { firstName: 'Z' })
    expect(res?.firstName).toBe('Z')
    // ensure we called update with only firstName in data
    const call = mPrisma.userProfile.update.mock.calls[0][0]
    expect(Object.keys(call.data)).toEqual(['firstName'])
  })
})
