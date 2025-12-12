import {
  __resetProducts,
  createProduct,
  deleteProduct,
  findProductById,
  listProducts,
  updateProduct,
} from '../productRepository';
import { initialProducts } from '../products';

describe('productRepository', () => {
  beforeEach(() => {
    __resetProducts();
  });

  it('lists seeded products', async () => {
    const result = await listProducts();
    expect(result).toHaveLength(initialProducts.length);
  });

  it('creates a product and can get by id', async () => {
    const created = await createProduct({ id: 'p100', name: 'New', stock: 1, price: 10 });
    expect(created).toMatchObject({ id: 'p100', name: 'New', stock: 1, price: 10 });
    const found = await findProductById('p100');
    expect(found).toEqual(created);
  });

  it('rejects duplicate id on create', async () => {
    await expect(
      createProduct({ id: initialProducts[0].id, name: 'Dup', stock: 1, price: 10 })
    ).rejects.toMatchObject({ code: 'PRODUCT_ALREADY_EXISTS' });
  });

  it('validates stock and price on create', async () => {
    await expect(
      createProduct({ id: 'p101', name: 'Bad', stock: -1, price: 10 })
    ).rejects.toMatchObject({ code: 'INVALID_STOCK' });
    await expect(
      createProduct({ id: 'p102', name: 'Bad', stock: 1, price: 0 })
    ).rejects.toMatchObject({
      code: 'INVALID_PRICE',
    });
  });

  it('updates product fields and validates', async () => {
    const target = initialProducts[0].id;
    const updated = await updateProduct(target, { name: 'Updated', stock: 5, price: 200 });
    expect(updated.name).toBe('Updated');
    expect(updated.stock).toBe(5);
    expect(updated.price).toBe(200);

    await expect(updateProduct(target, { stock: -2 })).rejects.toMatchObject({
      code: 'INVALID_STOCK',
    });
    await expect(updateProduct(target, { price: 0 })).rejects.toMatchObject({
      code: 'INVALID_PRICE',
    });
  });

  it('throws predictable error on missing product update/delete/get', async () => {
    await expect(updateProduct('missing', { name: 'X' })).rejects.toMatchObject({
      code: 'PRODUCT_NOT_FOUND',
    });
    await expect(deleteProduct('missing')).rejects.toMatchObject({ code: 'PRODUCT_NOT_FOUND' });
    const found = await findProductById('missing');
    expect(found).toBeUndefined();
  });

  it('deletes product by id', async () => {
    const target = initialProducts[0].id;
    await deleteProduct(target);
    const remaining = await listProducts();
    expect(remaining.find((p) => p.id === target)).toBeUndefined();
  });
});
