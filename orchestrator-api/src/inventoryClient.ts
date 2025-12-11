import { HttpClient } from "./utils/httpClient";
import { config } from "./config";

export type InventoryProduct = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

const client = new HttpClient({
  baseURL: config.inventoryApiUrl,
  serviceName: "inventory-api"
});

export async function fetchProductById(
  productId: string
): Promise<InventoryProduct> {
  try {
    return await client.get<InventoryProduct>(`/products/${productId}`);
  } catch (error: any) {
    if (error.code === "INVENTORY_API_NOT_FOUND") {
      const e = new Error(
        error.message || `Product with id '${productId}' was not found`
      );
      (e as any).code = "PRODUCT_NOT_FOUND";
      throw e;
    }
    throw error;
  }
}

export async function fetchAllProducts(): Promise<InventoryProduct[]> {
  return await client.get<InventoryProduct[]>("/products");
}