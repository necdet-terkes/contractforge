import { HttpClient } from "./utils/httpClient";
import { config } from "./config";

export type UserInfo = {
  id: string;
  name: string;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD";
};

const client = new HttpClient({
  baseURL: config.userApiUrl,
  serviceName: "user-api"
});

export async function fetchUserById(userId: string): Promise<UserInfo> {
  try {
    return await client.get<UserInfo>(`/users/${userId}`);
  } catch (error: any) {
    if (error.code === "USER_API_NOT_FOUND") {
      const e = new Error(
        error.message || `User with id '${userId}' was not found`
      );
      (e as any).code = "USER_NOT_FOUND";
      throw e;
    }
    throw error;
  }
}

export async function fetchAllUsers(): Promise<UserInfo[]> {
  return await client.get<UserInfo[]>("/users");
}