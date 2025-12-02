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

const PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=60";

const LOYALTY_META: Record<
  "BRONZE" | "SILVER" | "GOLD",
  { label: string; desc: string; color: string; bg: string; emoji: string }
> = {
  BRONZE: {
    label: "Bronze",
    desc: "Starter tier, light savings",
    color: "#b87333",
    bg: "rgba(184,115,51,0.12)",
    emoji: "🥉"
  },
  SILVER: {
    label: "Silver",
    desc: "Steady perks and better deals",
    color: "#8a8d93",
    bg: "rgba(138,141,147,0.12)",
    emoji: "🥈"
  },
  GOLD: {
    label: "Gold",
    desc: "Top benefits and strongest discounts",
    color: "#d4af37",
    bg: "rgba(212,175,55,0.12)",
    emoji: "🥇"
  }
};

const CheckoutView: React.FC = () => {
  // Products
  const [products, setProducts] = useState<ProductPart[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Users
  const [users, setUsers] = useState<UserPart[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Pricing per product for selected user
  const [pricingQuotes, setPricingQuotes] = useState<
    Record<string, PricingPart>
  >({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

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
      } catch (err: any) {
        setUsersError(err.message ?? "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    }

    loadUsers();
  }, []);

  useEffect(() => {
    async function loadPricingForUser() {
      if (!selectedUserId || products.length === 0) {
        setPricingQuotes({});
        setPricingError(null);
        setPricingLoading(false);
        return;
      }

      const user = users.find((u) => u.id === selectedUserId);
      if (!user) {
        setPricingQuotes({});
        return;
      }

      setPricingLoading(true);
      setPricingError(null);

      try {
        const entries = await Promise.all(
          products.map(async (product) => {
            const params = new URLSearchParams({
              productId: product.id,
              userId: user.id,
              basePrice: String(product.basePrice),
              loyaltyTier: user.loyaltyTier
            });

            const resp = await fetch(
              `${PRICING_API_BASE_URL}/pricing/quote?${params.toString()}`,
              { headers: { Accept: "application/json" } }
            );
            const data = await resp.json();
            if (!resp.ok) {
              throw new Error(data?.message ?? "Failed to calculate pricing");
            }
            return [product.id, data] as const;
          })
        );

        setPricingQuotes(Object.fromEntries(entries));
      } catch (err: any) {
        setPricingError(err.message ?? "Failed to calculate pricing");
        setPricingQuotes({});
      } finally {
        setPricingLoading(false);
      }
    }

    loadPricingForUser();
  }, [selectedUserId, products, users]);

  const formatPrice = (value: number) => `£${value.toFixed(2)}`;
  const tierStyle = (tier: UserPart["loyaltyTier"]) =>
    LOYALTY_META[tier as keyof typeof LOYALTY_META] ??
    LOYALTY_META.BRONZE;

  return (
    <>
      <h1>ContractForge – Checkout Preview</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Browse the catalog with stock and prices; pick a user to instantly see
        their discounted pricing.
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

      <section
        style={{
          marginBottom: "1.25rem",
          padding: "0.75rem 1rem",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          background:
            "linear-gradient(135deg, rgba(236,245,255,0.9), rgba(255,255,255,0.9))",
          boxShadow: "0 6px 18px rgba(15,23,42,0.08)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap"
          }}
        >
          <div>
            <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
              Choose a user to preview loyalty discounts
            </div>
            <div style={{ color: "#555", fontSize: "0.9rem" }}>
              No selection = base prices. Gold/Silver/Bronze tiers show the
              discounted totals below.
            </div>
          </div>
          {selectedUserId && (
            <button
              onClick={() => setSelectedUserId("")}
              style={{
                border: "1px solid #d0d7e2",
                background: "#fff",
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Clear selection
            </button>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "0.75rem",
            marginTop: "0.75rem"
          }}
        >
          {loadingUsers ? (
            <p style={{ margin: 0 }}>Loading users...</p>
          ) : users.length === 0 ? (
            <p style={{ margin: 0, color: "#777" }}>No users found.</p>
          ) : (
            users.map((u) => {
              const meta = tierStyle(u.loyaltyTier);
              const isActive = selectedUserId === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() =>
                    setSelectedUserId((prev) => (prev === u.id ? "" : u.id))
                  }
                  style={{
                    textAlign: "left",
                    border: isActive ? `2px solid ${meta.color}` : "1px solid #dbe2ef",
                    backgroundColor: isActive ? "rgba(13,110,253,0.06)" : "#fff",
                    borderRadius: "10px",
                    padding: "0.75rem",
                    cursor: "pointer",
                    boxShadow: isActive
                      ? "0 10px 24px rgba(0,0,0,0.08)"
                      : "0 6px 16px rgba(0,0,0,0.04)",
                    transition: "all 0.15s ease"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "0.35rem"
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>{u.name}</span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.85rem",
                        color: meta.color,
                        backgroundColor: meta.bg,
                        padding: "0.2rem 0.55rem",
                        borderRadius: "999px",
                        fontWeight: 700
                      }}
                    >
                      {meta.emoji} {meta.label}
                    </span>
                  </div>
                  <div style={{ color: "#667085", fontSize: "0.9rem" }}>
                    ID: {u.id}
                  </div>
                  <div style={{ color: "#475467", marginTop: "0.35rem" }}>
                    {meta.desc}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </section>

      {pricingError && (
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
          {pricingError}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem"
        }}
      >
        {products.map((product) => {
          const quote = pricingQuotes[product.id];
          const discountPercent =
            quote && quote.basePrice > 0
              ? Math.round((quote.discount / quote.basePrice) * 100)
              : 0;
          return (
            <div
              key={product.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
                background: "#fff",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <div
                style={{
                  height: "140px",
                  backgroundImage: `url(${PRODUCT_IMAGE})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
              <div style={{ padding: "0.75rem 1rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "0.4rem"
                  }}
                >
                  <h3 style={{ margin: 0 }}>{product.name}</h3>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      color: product.stock > 0 ? "#0f5132" : "#842029",
                      backgroundColor:
                        product.stock > 0 ? "#d1e7dd" : "#f8d7da",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "4px"
                    }}
                  >
                    {product.stock > 0 ? "In stock" : "Out of stock"}
                  </span>
                </div>
                <p style={{ margin: "0 0 0.25rem", color: "#666" }}>
                  ID: {product.id}
                </p>
                <p style={{ margin: "0 0 0.5rem", color: "#666" }}>
                  Stock: {product.stock}
                </p>
                {!selectedUserId || !quote ? (
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    Price: {formatPrice(product.basePrice)}
                  </p>
                ) : (
                  <div style={{ marginTop: "0.35rem" }}>
                    <div style={{ color: "#888", textDecoration: "line-through" }}>
                      {formatPrice(product.basePrice)}
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#0f5132"
                        }}
                      >
                        {formatPrice(quote.finalPrice)}
                      </span>
                      <span
                        style={{
                          color: "#0f5132",
                          backgroundColor: "#d1e7dd",
                          borderRadius: "999px",
                          padding: "0.15rem 0.5rem",
                          fontWeight: 600
                        }}
                      >
                        %{discountPercent} discount
                      </span>
                    </div>
                    <div style={{ color: "#888", fontSize: "0.85rem" }}>
                      Saved {formatPrice(quote.discount)} via pricing rules
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && !loadingProducts && (
        <p style={{ color: "#777" }}>No products found.</p>
      )}

      {pricingLoading && selectedUserId && (
        <p style={{ color: "#555", marginTop: "0.75rem" }}>
          Calculating discounts...
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

  async function handleUpdateUser(user: UserPart) {
    const name = window.prompt("Update name", user.name);
    if (name === null) return;
    const loyalty = window
      .prompt("Update loyalty tier (BRONZE/SILVER/GOLD)", user.loyaltyTier)
      ?.toUpperCase();
    if (loyalty === null) return;

    try {
      const resp = await fetch(`${USER_API_BASE_URL}/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          loyaltyTier: loyalty?.trim() || undefined
        })
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        setUsersError(data?.message ?? "Failed to update user");
        return;
      }
      await loadUsers();
    } catch (err: any) {
      setUsersError(err.message ?? "Failed to update user");
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

  async function handleUpdateProduct(product: ProductPart) {
    const name = window.prompt("Update product name", product.name);
    if (name === null) return;
    const stockRaw = window.prompt("Update stock (integer)", String(product.stock));
    if (stockRaw === null) return;
    const priceRaw = window.prompt(
      "Update price",
      String(product.basePrice)
    );
    if (priceRaw === null) return;

    const stock = Number(stockRaw);
    const price = Number(priceRaw);

    try {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name: name.trim(),
          stock,
          price
        })
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        setProductsError(data?.message ?? "Failed to update product");
        return;
      }
      await loadProducts();
    } catch (err: any) {
      setProductsError(err.message ?? "Failed to update product");
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

  async function handleUpdateRule(rule: DiscountRule) {
    const loyaltyInput = window
      .prompt(
        "Update loyalty tier (BRONZE/SILVER/GOLD) or leave as-is",
        rule.loyaltyTier
      )
      ?.toUpperCase();
    if (loyaltyInput === null) return;

    const rateRaw = window.prompt(
      "Update rate (0-1)",
      String(rule.rate)
    );
    if (rateRaw === null) return;

    const description = window.prompt(
      "Update description",
      rule.description || ""
    );
    if (description === null) return;

    const activeRaw = window.prompt(
      "Active? (true/false)",
      String(rule.active)
    );
    if (activeRaw === null) return;

    const updates: any = {
      loyaltyTier: loyaltyInput?.trim() || undefined,
      rate: rateRaw.trim() === "" ? undefined : Number(rateRaw),
      description: description.trim(),
      active:
        activeRaw.trim().toLowerCase() === "true"
          ? true
          : activeRaw.trim().toLowerCase() === "false"
          ? false
          : rule.active
    };

    try {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules/${rule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(updates)
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        setRulesError(data?.message ?? "Failed to update discount rule");
        return;
      }
      await loadRules();
    } catch (err: any) {
      setRulesError(err.message ?? "Failed to update discount rule");
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
                    <td align="right" style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                      <button onClick={() => handleUpdateUser(u)}>Edit</button>
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
                    <td align="right" style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                      <button onClick={() => handleUpdateProduct(p)}>
                        Edit
                      </button>
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
                    <td align="right" style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                      <button onClick={() => handleUpdateRule(r)}>
                        Edit
                      </button>
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
