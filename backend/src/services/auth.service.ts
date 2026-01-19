import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  // 12 rounds per security requirements
  return hash(password, 12);
}

export async function comparePassword(password: string, hashValue: string): Promise<boolean> {
  return compare(password, hashValue);
}

export function generateSession(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}) {
  // Minimal session payload; extend as needed
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    isAdmin: user.isAdmin,
  };
}
