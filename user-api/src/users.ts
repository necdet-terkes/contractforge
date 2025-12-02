export type User = {
  id: string;
  name: string;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD";
};

export const users: User[] = [
  {
    id: "u1",
    name: "Alice Example",
    loyaltyTier: "GOLD"
  },
  {
    id: "u2",
    name: "Bob Example",
    loyaltyTier: "SILVER"
  },
  {
    id: "u3",
    name: "Charlie Example",
    loyaltyTier: "BRONZE"
  }
];

export function getUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}