// user-api/src/userRepository.ts

import { initialUsers, LoyaltyTier, User } from './users';

let users: User[] = [...initialUsers];

export async function listUsers(): Promise<User[]> {
  // In a real system this would be a DB SELECT
  return users;
}

export async function findUserById(id: string): Promise<User | undefined> {
  return users.find((u) => u.id === id);
}

export async function createUser(input: {
  id: string;
  name: string;
  loyaltyTier: LoyaltyTier;
}): Promise<User> {
  const exists = users.some((u) => u.id === input.id);
  if (exists) {
    const error = new Error(`User with id '${input.id}' already exists`);
    (error as any).code = 'USER_ALREADY_EXISTS';
    throw error;
  }

  const newUser: User = {
    id: input.id,
    name: input.name,
    loyaltyTier: input.loyaltyTier,
  };

  users.push(newUser);
  return newUser;
}

export async function updateUser(
  id: string,
  updates: Partial<Pick<User, 'name' | 'loyaltyTier'>>
): Promise<User> {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    const error = new Error(`User with id '${id}' not found`);
    (error as any).code = 'USER_NOT_FOUND';
    throw error;
  }

  const current = users[idx];
  const updated: User = {
    ...current,
    ...updates,
  };

  users[idx] = updated;
  return updated;
}

export async function deleteUser(id: string): Promise<void> {
  const idx = users.findIndex((u) => u.id === id);
  if (idx === -1) {
    const error = new Error(`User with id '${id}' not found`);
    (error as any).code = 'USER_NOT_FOUND';
    throw error;
  }

  users.splice(idx, 1);
}
