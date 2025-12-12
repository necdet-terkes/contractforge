// user-api/src/users.ts

import { LoyaltyTier } from '../../types/loyaltyTier';

export type { LoyaltyTier };

export type User = {
  id: string;
  name: string;
  loyaltyTier: LoyaltyTier;
};

// Initial seed data for the in-memory repository
export const initialUsers: User[] = [
  {
    id: 'u1',
    name: 'Alice Example',
    loyaltyTier: 'GOLD',
  },
  {
    id: 'u2',
    name: 'Bob Example',
    loyaltyTier: 'SILVER',
  },
  {
    id: 'u3',
    name: 'Charlie Example',
    loyaltyTier: 'BRONZE',
  },
  {
    id: 'u4',
    name: 'Diana Shopper',
    loyaltyTier: 'GOLD',
  },
  {
    id: 'u5',
    name: 'Ethan Frequent',
    loyaltyTier: 'SILVER',
  },
];
