import { prisma } from '@/config/database';

export type UserProfileInput = {
  firstName: string;
  lastName: string;
  roleTitle: string;
  mainFocus: string[]; // up to 4 keywords
  projectReferences?: { current?: string; past?: string } | null;
  experience?: string | null;
  certifications?: string | null;
  tools?: string[] | null;
  methods?: string[] | null;
  softSkills?: string[] | null;
  education?: string | null;
  profileImageUrl?: string | null;
};

function parseJSON<T>(str: string | null | undefined, fallback: T): T {
  if (!str) return fallback;
  try {
    return JSON.parse(str) as T;
  } catch {
    return fallback;
  }
}

function toRow(input: UserProfileInput) {
  const normalizeMainFocus = (v: unknown): string[] => {
    try {
      if (Array.isArray(v)) return (v as unknown[]).map(String).map(s=>s.trim()).filter(Boolean).slice(0,4)
      if (typeof v === 'string') return v.split(',').map(s=>s.trim()).filter(Boolean).slice(0,4)
      return []
    } catch { return [] }
  }
  return {
    firstName: input.firstName,
    lastName: input.lastName,
    roleTitle: input.roleTitle,
    // store as JSON string in existing text column
    mainFocus: JSON.stringify(normalizeMainFocus(input.mainFocus)),
    projectReferences: JSON.stringify(input.projectReferences ?? { current: '', past: '' }),
    experience: input.experience ?? '',
    certifications: input.certifications ?? '',
    tools: JSON.stringify(input.tools ?? []),
    methods: JSON.stringify(input.methods ?? []),
    softSkills: JSON.stringify(input.softSkills ?? []),
    education: input.education ?? '',
    profileImageUrl: input.profileImageUrl ?? '',
  };
}

function fromRow(row: any) {
  if (!row) return null;
  const parseArray = (str: string): string[] => {
    try {
      const v = JSON.parse(str)
      if (Array.isArray(v)) return v.map(String)
      return []
    } catch { return [] }
  }
  return {
    ...row,
    // parse arrays stored as JSON strings
    mainFocus: parseArray(row.mainFocus),
    projectReferences: parseJSON(row.projectReferences, { current: '', past: '' }),
    tools: parseJSON(row.tools, [] as string[]),
    methods: parseJSON(row.methods, [] as string[]),
    softSkills: parseJSON(row.softSkills, [] as string[]),
  };
}

export async function getUserProfile(userId: string) {
  const row = await prisma.userProfile.findUnique({ where: { userId } });
  return fromRow(row);
}

export async function createUserProfile(userId: string, input: UserProfileInput) {
  const data = toRow(input);
  const created = await prisma.userProfile.create({ data: { userId, ...data } });
  return fromRow(created);
}

export async function updateUserProfile(userId: string, input: Partial<UserProfileInput>) {
  const data = toRow({
    firstName: input.firstName ?? '',
    lastName: input.lastName ?? '',
    roleTitle: input.roleTitle ?? '',
    mainFocus: input.mainFocus ?? [],
    projectReferences: input.projectReferences ?? { current: '', past: '' },
    experience: input.experience ?? '',
    certifications: input.certifications ?? '',
    tools: input.tools ?? [],
    methods: input.methods ?? [],
    softSkills: input.softSkills ?? [],
    education: input.education ?? '',
    profileImageUrl: input.profileImageUrl ?? '',
  });
  // Use update with only provided fields: rebuild partial
  const partial: any = {};
  if (input.firstName !== undefined) partial.firstName = data.firstName;
  if (input.lastName !== undefined) partial.lastName = data.lastName;
  if (input.roleTitle !== undefined) partial.roleTitle = data.roleTitle;
  if (input.mainFocus !== undefined) partial.mainFocus = data.mainFocus;
  if (input.projectReferences !== undefined) partial.projectReferences = data.projectReferences;
  if (input.experience !== undefined) partial.experience = data.experience;
  if (input.certifications !== undefined) partial.certifications = data.certifications;
  if (input.tools !== undefined) partial.tools = data.tools;
  if (input.methods !== undefined) partial.methods = data.methods;
  if (input.softSkills !== undefined) partial.softSkills = data.softSkills;
  if (input.education !== undefined) partial.education = data.education;
  if (input.profileImageUrl !== undefined) partial.profileImageUrl = data.profileImageUrl;

  const updated = await prisma.userProfile.update({ where: { userId }, data: partial });
  return fromRow(updated);
}
