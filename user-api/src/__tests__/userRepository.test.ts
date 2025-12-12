import {
  __resetUsers,
  createUser,
  deleteUser,
  findUserById,
  listUsers,
  updateUser,
} from '../userRepository';
import { initialUsers } from '../users';

describe('userRepository', () => {
  beforeEach(() => {
    __resetUsers();
  });

  it('lists seeded users', async () => {
    const result = await listUsers();
    expect(result).toHaveLength(initialUsers.length);
  });

  it('creates user and fetches by id', async () => {
    const created = await createUser({ id: 'u100', name: 'Test User', loyaltyTier: 'GOLD' });
    expect(created).toMatchObject({ id: 'u100', name: 'Test User', loyaltyTier: 'GOLD' });
    const found = await findUserById('u100');
    expect(found).toEqual(created);
  });

  it('rejects duplicate id', async () => {
    await expect(
      createUser({ id: initialUsers[0].id, name: 'Dup', loyaltyTier: 'SILVER' })
    ).rejects.toMatchObject({ code: 'USER_ALREADY_EXISTS' });
  });

  it('updates user fields', async () => {
    const target = initialUsers[0].id;
    const updated = await updateUser(target, { name: 'Updated Name', loyaltyTier: 'BRONZE' });
    expect(updated.name).toBe('Updated Name');
    expect(updated.loyaltyTier).toBe('BRONZE');
  });

  it('throws predictable error for missing user update/delete', async () => {
    await expect(updateUser('missing', { name: 'X' })).rejects.toMatchObject({
      code: 'USER_NOT_FOUND',
    });
    await expect(deleteUser('missing')).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
    const found = await findUserById('missing');
    expect(found).toBeUndefined();
  });

  it('deletes user by id', async () => {
    const target = initialUsers[0].id;
    await deleteUser(target);
    const remaining = await listUsers();
    expect(remaining.find((u) => u.id === target)).toBeUndefined();
  });
});
