import axios from "axios";

export type UserInfo = {
  id: string;
  name: string;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD";
};

const USER_API_URL = process.env.USER_API_URL || "http://localhost:4002";

export async function fetchUserById(userId: string): Promise<UserInfo> {
  const url = `${USER_API_URL}/users/${userId}`;

  try {
    const response = await axios.get<UserInfo>(url, {
      headers: { Accept: "application/json" }
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      const e = new Error(
        error.response.data?.message ||
          `User with id '${userId}' was not found`
      );
      (e as any).code = "USER_NOT_FOUND";
      throw e;
    }

    const e = new Error("Failed to fetch user from user-api");
    (e as any).code = "USER_API_ERROR";
    throw e;
  }
}

// NEW: fetch all users
export async function fetchAllUsers(): Promise<UserInfo[]> {
  const url = `${USER_API_URL}/users`;

  try {
    const response = await axios.get<UserInfo[]>(url, {
      headers: { Accept: "application/json" }
    });
    return response.data;
  } catch (_error: any) {
    const e = new Error("Failed to fetch user list from user-api");
    (e as any).code = "USER_API_ERROR";
    throw e;
  }
}