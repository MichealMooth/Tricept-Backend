import { Request, Response } from 'express';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
  type UserProfileInput,
} from '@/services/user-profile.service';

const currentUserId = (req: Request) => String((req as any).user?.id || '');
const isAdmin = (req: Request) => Boolean((req as any).user?.isAdmin);

export async function getProfile(req: Request, res: Response) {
  const { userId } = req.params as { userId: string };
  if (!userId) return res.status(400).json({ message: 'userId required' });
  const start = Date.now();
  try {
    console.log(`[user-profile] get start userId=${userId}`);
    const row = await getUserProfile(userId);
    const ms = Date.now() - start;
    console.log(`[user-profile] get done userId=${userId} in ${ms}ms found=${!!row}`);
    if (!row) return res.status(404).json({ message: 'not found' });
    return res.json(row);
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`[user-profile] get error userId=${userId} after ${ms}ms`, err);
    return res.status(500).json({ message: 'failed to fetch profile' });
  }
}

export async function createProfile(req: Request, res: Response) {
  const body = req.body as Partial<UserProfileInput> & { userId?: string };
  const me = currentUserId(req);
  if (!me) return res.status(401).json({ message: 'Unauthorized' });

  const targetUserId = isAdmin(req) && body.userId ? String(body.userId) : me;
  if (!body.firstName || !body.lastName || !body.roleTitle || !body.mainFocus) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  const input: UserProfileInput = {
    firstName: body.firstName,
    lastName: body.lastName,
    roleTitle: body.roleTitle,
    mainFocus: body.mainFocus,
    projectReferences: body.projectReferences ?? { current: '', past: '' },
    experience: body.experience ?? '',
    certifications: body.certifications ?? '',
    tools: body.tools ?? [],
    methods: body.methods ?? [],
    softSkills: body.softSkills ?? [],
    education: body.education ?? '',
    profileImageUrl: body.profileImageUrl ?? '',
  };
  const created = await createUserProfile(targetUserId, input);
  return res.status(201).json(created);
}

export async function updateProfile(req: Request, res: Response) {
  const { userId } = req.params as { userId: string };
  const me = currentUserId(req);
  if (!userId) return res.status(400).json({ message: 'userId required' });
  if (!isAdmin(req) && userId !== me) return res.status(403).json({ message: 'Forbidden' });

  const updated = await updateUserProfile(userId, req.body || {});
  return res.json(updated);
}
