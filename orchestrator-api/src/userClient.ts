import { HttpClient } from './utils/httpClient';
import { config } from './config';

export type UserInfo = {
  id: string;
  name: string;
  loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD';
};

const client = new HttpClient({
  baseURL: config.userApiUrl,
  serviceName: 'user-api',
});

export function buildUserPath(userId: string) {
  return `/users/${userId}`;
}

export async function fetchUserById(userId: string): Promise<UserInfo> {
  try {
    return await client.get<UserInfo>(buildUserPath(userId));
  } catch (error: any) {
    if (error.code === 'USER_API_NOT_FOUND') {
      const e = new Error(error.message || `User with id '${userId}' was not found`);
      (e as any).code = 'USER_NOT_FOUND';
      throw e;
    }
    throw error;
  }
}

export async function fetchAllUsers(): Promise<UserInfo[]> {
  return await client.get<UserInfo[]>('/users');
}

export async function createUser(user: { id: string; name: string; loyaltyTier: 'BRONZE' | 'SILVER' | 'GOLD' }): Promise<UserInfo> {
  return await client.post<UserInfo>('/users', user);
}

export async function updateUser(userId: string, updates: { name?: string; loyaltyTier?: 'BRONZE' | 'SILVER' | 'GOLD' }): Promise<UserInfo> {
  return await client.put<UserInfo>(buildUserPath(userId), updates);
}

export async function deleteUser(userId: string): Promise<void> {
  return await client.delete(buildUserPath(userId));
}
