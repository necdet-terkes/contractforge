import axios from "axios";

export type InventoryProduct = {
  id: string;
  name: string;
  stock: number;
  price: number;
};

const INVENTORY_API_URL =
  process.env.INVENTORY_API_URL || "http://localhost:4001";

export async function fetchProductById(
  productId: string
): Promise<InventoryProduct> {
  const url = `${INVENTORY_API_URL}/products/${productId}`;

  try {
    const response = await axios.get<InventoryProduct>(url, {
      headers: { Accept: "application/json" }
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      const message =
        error.response.data?.message ||
        `Product with id '${productId}' was not found`;
      const e = new Error(message);
      (e as any).code = "PRODUCT_NOT_FOUND";
      throw e;
    }

    const e = new Error("Failed to fetch product from inventory-api");
    (e as any).code = "INVENTORY_API_ERROR";
    throw e;
  }
}

// 👇 NEW – fetch all products
export async function fetchAllProducts(): Promise<InventoryProduct[]> {
  const url = `${INVENTORY_API_URL}/products`;

  try {
    const response = await axios.get<InventoryProduct[]>(url, {
      headers: { Accept: "application/json" }
    });
    return response.data;
  } catch (_error: any) {
    const e = new Error("Failed to fetch product list from inventory-api");
    (e as any).code = "INVENTORY_API_ERROR";
    throw e;
  }
}