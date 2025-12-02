import React, { useEffect, useState } from "react";

// ===== Shared Types =====

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

// For admin pricing rules view
type DiscountRule = {
  id: string;
  loyaltyTier: "BRONZE" | "SILVER" | "GOLD";
  rate: number;
  description?: string;
  active: boolean;
};

// ===== Base URLs =====

const ORCHESTRATOR_BASE_URL =
  import.meta.env.VITE_ORCHESTRATOR_BASE_URL || "http://localhost:4000";

const INVENTORY_API_BASE_URL =
  import.meta.env.VITE_INVENTORY_API_URL || "http://localhost:4001";

const USER_API_BASE_URL =
  import.meta.env.VITE_USER_API_URL || "http://localhost:4002";

const PRICING_API_BASE_URL =
  import.meta.env.VITE_PRICING_API_URL || "http://localhost:4003";

// =========================================================
// Checkout View (existing orchestrator-based flow)
// =========================================================

const CheckoutView: React.FC = () => {
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

  // Load products from orchestrator
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

  // Load users from orchestrator
  useEffect(() => {
    async function loadUsers() {
      setLoadingUsers(true);
      setUsersError(null);

      try {
        const resp = await fetch(`${ORCHESTRATOR_BASE_URL}/catalog/users`, {
          headers: { Accept: "application/json" }
        });

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

  // Preview request
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
    <>
      <h1>ContractForge – Checkout Preview</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Select a product and a user, then fetch the combined preview from the
        orchestrator API.
      </p>

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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginBottom: "1.5rem"
        }}
      >
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
    </>
  );
};

// =========================================================
// Admin View – direct calls to microservices
// =========================================================

const AdminView: React.FC = () => {
  // Users
  const [users, setUsers] = useState<UserPart[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    loyaltyTier: "BRONZE"
  });

  // Products
  const [products, setProducts] = useState<ProductPart[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    id: "",
    name: "",
    stock: 0,
    price: 0
  });

  // Discount rules
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({
    id: "",
    loyaltyTier: "BRONZE" as DiscountRule["loyaltyTier"],
    rate: 0,
    description: "",
    active: true
  });

  // ----- Loaders -----

  async function loadUsers() {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const resp = await fetch(`${USER_API_BASE_URL}/users`, {
        headers: { Accept: "application/json" }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setUsersError(data?.message ?? "Failed to load users");
        return;
      }
      setUsers(data);
    } catch (err: any) {
      setUsersError(err.message ?? "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }

  async function loadProducts() {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products`, {
        headers: { Accept: "application/json" }
      });
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
    } catch (err: any) {
      setProductsError(err.message ?? "Failed to load products");
    } finally {
      setProductsLoading(false);
    }
  }

  async function loadRules() {
    setRulesLoading(true);
    setRulesError(null);
    try {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules`, {
        headers: { Accept: "application/json" }
      });
      const data = await resp.json();
      if (!resp.ok) {
        setRulesError(data?.message ?? "Failed to load discount rules");
        return;
      }
      setRules(data);
    } catch (err: any) {
      setRulesError(err.message ?? "Failed to load discount rules");
    } finally {
      setRulesLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    loadUsers();
    loadProducts();
    loadRules();
  }, []);

  // ----- Create handlers -----

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUsersError(null);

    try {
      const resp = await fetch(`${USER_API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(newUser)
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        setUsersError(data?.message ?? "Failed to create user");
        return;
      }

      setNewUser({ id: "", name: "", loyaltyTier: "BRONZE" });
      await loadUsers();
    } catch (err: any) {
      setUsersError(err.message ?? "Failed to create user");
    }
  }

  async function handleDeleteUser(id: string) {
    setUsersError(null);
    try {
      const resp = await fetch(`${USER_API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" }
      });

      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => null);
        setUsersError(data?.message ?? "Failed to delete user");
        return;
      }

      await loadUsers();
    } catch (err: any) {
      setUsersError(err.message ?? "Failed to delete user");
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductsError(null);

    try {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          id: newProduct.id,
          name: newProduct.name,
          stock: Number(newProduct.stock),
          price: Number(newProduct.price)
        })
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        setProductsError(data?.message ?? "Failed to create product");
        return;
      }

      setNewProduct({ id: "", name: "", stock: 0, price: 0 });
      await loadProducts();
    } catch (err: any) {
      setProductsError(err.message ?? "Failed to create product");
    }
  }

  async function handleDeleteProduct(id: string) {
    setProductsError(null);
    try {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" }
      });

      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => null);
        setProductsError(data?.message ?? "Failed to delete product");
        return;
      }

      await loadProducts();
    } catch (err: any) {
      setProductsError(err.message ?? "Failed to delete product");
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setRulesError(null);

    try {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          id: newRule.id,
          loyaltyTier: newRule.loyaltyTier,
          rate: Number(newRule.rate),
          description: newRule.description,
          active: newRule.active
        })
      });

      const data = await resp.json().catch(() => null);

      if (!resp.ok) {
        setRulesError(data?.message ?? "Failed to create discount rule");
        return;
      }

      setNewRule({
        id: "",
        loyaltyTier: "BRONZE",
        rate: 0,
        description: "",
        active: true
      });
      await loadRules();
    } catch (err: any) {
      setRulesError(err.message ?? "Failed to create discount rule");
    }
  }

  async function handleDeleteRule(id: string) {
    setRulesError(null);
    try {
      const resp = await fetch(
        `${PRICING_API_BASE_URL}/pricing/rules/${id}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" }
        }
      );

      if (!resp.ok && resp.status !== 204) {
        const data = await resp.json().catch(() => null);
        setRulesError(data?.message ?? "Failed to delete discount rule");
        return;
      }

      await loadRules();
    } catch (err: any) {
      setRulesError(err.message ?? "Failed to delete discount rule");
    }
  }

  return (
    <>
      <h1>ContractForge – Admin Console</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Manage users, products and pricing rules used by the checkout flow.
      </p>

      {/* USERS */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "1rem",
          marginBottom: "1rem"
        }}
      >
        <h2>Users</h2>
        {usersError && (
          <div
            style={{
              border: "1px solid #f5c2c7",
              backgroundColor: "#f8d7da",
              color: "#842029",
              padding: "0.5rem 0.75rem",
              borderRadius: "4px",
              marginBottom: "0.75rem"
            }}
          >
            {usersError}
          </div>
        )}

        <form
          onSubmit={handleCreateUser}
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "0.75rem"
          }}
        >
          <input
            placeholder="ID (e.g. u4)"
            value={newUser.id}
            onChange={(e) =>
              setNewUser((prev) => ({ ...prev, id: e.target.value }))
            }
          />
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) =>
              setNewUser((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <select
            value={newUser.loyaltyTier}
            onChange={(e) =>
              setNewUser((prev) => ({
                ...prev,
                loyaltyTier: e.target.value
              }))
            }
          >
            <option value="BRONZE">BRONZE</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD">GOLD</option>
          </select>
          <button type="submit" disabled={usersLoading}>
            Add User
          </button>
        </form>

        <div style={{ maxHeight: "220px", overflowY: "auto" }}>
          {usersLoading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <p style={{ color: "#777" }}>No users found.</p>
          ) : (
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th align="left">ID</th>
                  <th align="left">Name</th>
                  <th align="left">Tier</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.loyaltyTier}</td>
                    <td align="right">
                      <button onClick={() => handleDeleteUser(u.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* PRODUCTS */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "1rem",
          marginBottom: "1rem"
        }}
      >
        <h2>Products</h2>
        {productsError && (
          <div
            style={{
              border: "1px solid #f5c2c7",
              backgroundColor: "#f8d7da",
              color: "#842029",
              padding: "0.5rem 0.75rem",
              borderRadius: "4px",
              marginBottom: "0.75rem"
            }}
          >
            {productsError}
          </div>
        )}

        <form
          onSubmit={handleCreateProduct}
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "0.75rem"
          }}
        >
          <input
            placeholder="ID (e.g. p10)"
            value={newProduct.id}
            onChange={(e) =>
              setNewProduct((prev) => ({ ...prev, id: e.target.value }))
            }
          />
          <input
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <input
            type="number"
            placeholder="Stock"
            value={newProduct.stock}
            onChange={(e) =>
              setNewProduct((prev) => ({
                ...prev,
                stock: Number(e.target.value)
              }))
            }
          />
          <input
            type="number"
            placeholder="Price"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct((prev) => ({
                ...prev,
                price: Number(e.target.value)
              }))
            }
          />
          <button type="submit" disabled={productsLoading}>
            Add Product
          </button>
        </form>

        <div style={{ maxHeight: "220px", overflowY: "auto" }}>
          {productsLoading ? (
            <p>Loading products...</p>
          ) : products.length === 0 ? (
            <p style={{ color: "#777" }}>No products found.</p>
          ) : (
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th align="left">ID</th>
                  <th align="left">Name</th>
                  <th align="right">Stock</th>
                  <th align="right">Price</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td align="right">{p.stock}</td>
                    <td align="right">£{p.basePrice}</td>
                    <td align="right">
                      <button onClick={() => handleDeleteProduct(p.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* PRICING RULES */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "1rem",
          marginBottom: "1rem"
        }}
      >
        <h2>Pricing Rules</h2>
        {rulesError && (
          <div
            style={{
              border: "1px solid #f5c2c7",
              backgroundColor: "#f8d7da",
              color: "#842029",
              padding: "0.5rem 0.75rem",
              borderRadius: "4px",
              marginBottom: "0.75rem"
            }}
          >
            {rulesError}
          </div>
        )}

        <form
          onSubmit={handleCreateRule}
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginBottom: "0.75rem"
          }}
        >
          <input
            placeholder="Rule ID (e.g. rule-gold-30)"
            value={newRule.id}
            onChange={(e) =>
              setNewRule((prev) => ({ ...prev, id: e.target.value }))
            }
          />
          <select
            value={newRule.loyaltyTier}
            onChange={(e) =>
              setNewRule((prev) => ({
                ...prev,
                loyaltyTier: e.target.value as DiscountRule["loyaltyTier"]
              }))
            }
          >
            <option value="BRONZE">BRONZE</option>
            <option value="SILVER">SILVER</option>
            <option value="GOLD">GOLD</option>
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Rate (0–1)"
            value={newRule.rate}
            onChange={(e) =>
              setNewRule((prev) => ({
                ...prev,
                rate: Number(e.target.value)
              }))
            }
          />
          <input
            placeholder="Description (optional)"
            value={newRule.description}
            onChange={(e) =>
              setNewRule((prev) => ({
                ...prev,
                description: e.target.value
              }))
            }
          />
          <label style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            <input
              type="checkbox"
              checked={newRule.active}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, active: e.target.checked }))
              }
            />
            Active
          </label>
          <button type="submit" disabled={rulesLoading}>
            Add Rule
          </button>
        </form>

        <div style={{ maxHeight: "220px", overflowY: "auto" }}>
          {rulesLoading ? (
            <p>Loading discount rules...</p>
          ) : rules.length === 0 ? (
            <p style={{ color: "#777" }}>No discount rules found.</p>
          ) : (
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
              <thead>
                <tr>
                  <th align="left">ID</th>
                  <th align="left">Tier</th>
                  <th align="right">Rate</th>
                  <th align="left">Description</th>
                  <th align="center">Active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r.id}>
                    <td>{r.id}</td>
                    <td>{r.loyaltyTier}</td>
                    <td align="right">{r.rate}</td>
                    <td>{r.description}</td>
                    <td align="center">{r.active ? "✅" : "❌"}</td>
                    <td align="right">
                      <button onClick={() => handleDeleteRule(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
};

// =========================================================
// Root App – tab switch between Checkout and Admin
// =========================================================

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"checkout" | "admin">("checkout");

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "2rem auto",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
      }}
    >
      {/* Tab Switch */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "1.5rem",
          borderBottom: "1px solid #ddd",
          paddingBottom: "0.5rem"
        }}
      >
        <button
          onClick={() => setActiveTab("checkout")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border:
              activeTab === "checkout" ? "1px solid #333" : "1px solid #ccc",
            backgroundColor: activeTab === "checkout" ? "#333" : "#f7f7f7",
            color: activeTab === "checkout" ? "#fff" : "#333",
            cursor: "pointer"
          }}
        >
          Checkout
        </button>
        <button
          onClick={() => setActiveTab("admin")}
          style={{
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            border:
              activeTab === "admin" ? "1px solid #333" : "1px solid #ccc",
            backgroundColor: activeTab === "admin" ? "#333" : "#f7f7f7",
            color: activeTab === "admin" ? "#fff" : "#333",
            cursor: "pointer"
          }}
        >
          Admin
        </button>
      </div>

      {activeTab === "checkout" ? <CheckoutView /> : <AdminView />}
    </div>
  );
};