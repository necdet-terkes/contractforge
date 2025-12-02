import React, { useEffect, useState } from "react";

type ProductPart = {
  id: string;
  name: string;
  stock: number;
  basePrice: number;
};

type UserPart = {
  id: string;
  name: string;
  loyaltyTier: string;
};

type PricingPart = {
  productId: string;
  userId: string;
  basePrice: number;
  discount: number;
  finalPrice: number;
  currency: string;
};

type CheckoutPreview = {
  product: ProductPart;
  user: UserPart;
  pricing: PricingPart;
};

type ApiError = {
  error: string;
  message: string;
};

const ORCHESTRATOR_BASE_URL =
  import.meta.env.VITE_ORCHESTRATOR_BASE_URL || "http://localhost:4000";

export const App: React.FC = () => {
  // Products
  const [products, setProducts] = useState<ProductPart[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Users
  const [users, setUsers] = useState<UserPart[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  // Selections
  const [productId, setProductId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  // Preview + errors
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * Load product list from orchestrator on first render
   */
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      setProductsError(null);

      try {
        const resp = await fetch(
          `${ORCHESTRATOR_BASE_URL}/catalog/products`,
          {
            headers: { Accept: "application/json" }
          }
        );

        const data = await resp.json();

        if (!resp.ok) {
          setProductsError(data?.message ?? "Failed to load products");
          return;
        }

        const mapped: ProductPart[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          basePrice: p.price
        }));

        setProducts(mapped);

        if (mapped.length > 0) {
          setProductId(mapped[0].id);
        }
      } catch (err: any) {
        setProductsError(err.message ?? "Failed to load products");
      } finally {
        setLoadingProducts(false);
      }
    }

    loadProducts();
  }, []);

  /**
   * Load user list from orchestrator on first render
   */
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      setUsersError(null);

      try {
        const resp = await fetch(
          `${ORCHESTRATOR_BASE_URL}/catalog/users`,
          {
            headers: { Accept: "application/json" }
          }
        );

        const data = await resp.json();

        if (!resp.ok) {
          setUsersError(data?.message ?? "Failed to load users");
          return;
        }

        const mapped: UserPart[] = data.map((u: any) => ({
          id: u.id,
          name: u.name,
          loyaltyTier: u.loyaltyTier
        }));

        setUsers(mapped);

        if (mapped.length > 0) {
          setUserId(mapped[0].id);
        }
      } catch (err: any) {
        setUsersError(err.message ?? "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  /**
   * Preview request
   */
  async function handleFetchPreview() {
    setLoading(true);
    setPreview(null);
    setError(null);

    const query = new URLSearchParams({
      productId,
      userId
    });

    try {
      const resp = await fetch(
        `${ORCHESTRATOR_BASE_URL}/checkout/preview?${query.toString()}`,
        {
          headers: {
            Accept: "application/json"
          }
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        setError(data);
      } else {
        setPreview(data);
      }
    } catch (err: any) {
      setError({
        error: "NETWORK_ERROR",
        message: err.message ?? "Failed to call orchestrator-api"
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: "720px",
        margin: "2rem auto",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      <h1>ContractForge – Checkout Preview</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Select a product and a user, then fetch the combined preview from the
        orchestrator API.
      </p>

      {/* Product / User loading errors */}
      {(productsError || usersError) && (
        <div
          style={{
            border: "1px solid #f5c2c7",
            backgroundColor: "#f8d7da",
            color: "#842029",
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem"
          }}
        >
          {productsError && (
            <>
              <strong>Product Error:</strong> {productsError}
              <br />
            </>
          )}
          {usersError && (
            <>
              <strong>User Error:</strong> {usersError}
            </>
          )}
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginBottom: "1.5rem"
        }}
      >
        {/* Product Select */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label htmlFor="product-select">Product:</label>
          <select
            id="product-select"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            disabled={loadingProducts || products.length === 0}
          >
            {loadingProducts && <option>Loading products...</option>}
            {!loadingProducts &&
              products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id}) – stock: {p.stock}
                </option>
              ))}
          </select>
        </div>

        {/* User Select */}
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label htmlFor="user-select">User:</label>
          <select
            id="user-select"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loadingUsers || users.length === 0}
          >
            {loadingUsers && <option>Loading users...</option>}
            {!loadingUsers &&
              users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.loyaltyTier})
                </option>
              ))}
          </select>
        </div>

        <div>
          <button
            onClick={handleFetchPreview}
            disabled={
              loading ||
              !productId ||
              !userId ||
              products.length === 0 ||
              users.length === 0
            }
          >
            {loading ? "Loading..." : "Get Preview"}
          </button>
        </div>
      </div>

      {/* Error from preview */}
      {error && (
        <div
          style={{
            border: "1px solid #f5c2c7",
            backgroundColor: "#f8d7da",
            color: "#842029",
            padding: "0.75rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem"
          }}
        >
          <strong>Error:</strong> {error.error}
          <br />
          <span>{error.message}</span>
        </div>
      )}

      {/* Preview cards */}
      {preview && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem"
          }}
        >
          <div
            style={{
              border: "1px solid #ddd",
              padding: "1rem",
              borderRadius: "4px"
            }}
          >
            <h2>Product</h2>
            <p>
              <strong>ID:</strong> {preview.product.id}
            </p>
            <p>
              <strong>Name:</strong> {preview.product.name}
            </p>
            <p>
              <strong>Stock:</strong> {preview.product.stock}
            </p>
            <p>
              <strong>Base Price:</strong> £{preview.product.basePrice}
            </p>
          </div>

          <div
            style={{
              border: "1px solid #ddd",
              padding: "1rem",
              borderRadius: "4px"
            }}
          >
            <h2>User & Pricing</h2>
            <p>
              <strong>User:</strong> {preview.user.name} (
              {preview.user.loyaltyTier})
            </p>
            <p>
              <strong>Base Price:</strong> £{preview.pricing.basePrice}
            </p>
            <p>
              <strong>Discount:</strong> £{preview.pricing.discount}
            </p>
            <p>
              <strong>Final Price:</strong> £{preview.pricing.finalPrice}{" "}
              {preview.pricing.currency}
            </p>
          </div>
        </div>
      )}

      {!preview && !error && !loading && (
        <p style={{ color: "#777" }}>
          Select a product and user, then click "Get Preview" to see the
          orchestrated response.
        </p>
      )}
    </div>
  );
};