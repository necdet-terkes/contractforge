// inventory-api/src/productRepository.ts

import { initialProducts, Product } from "./products";

let products: Product[] = [...initialProducts];

export async function listProducts(): Promise<Product[]> {
  // In a real system this would be a DB SELECT
  return products;
}

export async function findProductById(
  id: string
): Promise<Product | undefined> {
  return products.find((p) => p.id === id);
}

export async function createProduct(input: {
  id: string;
  name: string;
  stock: number;
  price: number;
}): Promise<Product> {
  const exists = products.some((p) => p.id === input.id);
  if (exists) {
    const error = new Error(`Product with id '${input.id}' already exists`);
    (error as any).code = "PRODUCT_ALREADY_EXISTS";
    throw error;
  }

  if (input.stock < 0 || !Number.isInteger(input.stock)) {
    const error = new Error("Stock must be a non-negative integer");
    (error as any).code = "INVALID_STOCK";
    throw error;
  }

  if (input.price <= 0) {
    const error = new Error("Price must be a positive number");
    (error as any).code = "INVALID_PRICE";
    throw error;
  }

  const newProduct: Product = {
    id: input.id,
    name: input.name,
    stock: input.stock,
    price: input.price
  };

  products.push(newProduct);
  return newProduct;
}

export async function updateProduct(
  id: string,
  updates: Partial<Pick<Product, "name" | "stock" | "price">>
): Promise<Product> {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) {
    const error = new Error(`Product with id '${id}' not found`);
    (error as any).code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  const current = products[idx];

  if (updates.stock != null) {
    if (updates.stock < 0 || !Number.isInteger(updates.stock)) {
      const error = new Error("Stock must be a non-negative integer");
      (error as any).code = "INVALID_STOCK";
      throw error;
    }
  }

  if (updates.price != null) {
    if (updates.price <= 0) {
      const error = new Error("Price must be a positive number");
      (error as any).code = "INVALID_PRICE";
      throw error;
    }
  }

  const updated: Product = {
    ...current,
    ...updates
  };

  products[idx] = updated;
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) {
    const error = new Error(`Product with id '${id}' not found`);
    (error as any).code = "PRODUCT_NOT_FOUND";
    throw error;
  }

  products.splice(idx, 1);
}