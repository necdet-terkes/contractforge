// src/CheckoutView.tsx

import React, { useEffect, useState } from "react";
import {
  ProductPart,
  UserPart,
  PricingPart
} from "./types";
import {
  ORCHESTRATOR_BASE_URL,
  PRICING_API_BASE_URL,
  PRODUCT_IMAGE
} from "./config";

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

const errorBoxStyle: React.CSSProperties = {
  border: "1px solid #f5c2c7",
  backgroundColor: "#f8d7da",
  color: "#842029",
  padding: "0.75rem 1rem",
  borderRadius: "4px",
  marginBottom: "1rem"
};

export const CheckoutView: React.FC = () => {
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

  // Load pricing quotes when user selection changes
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
    LOYALTY_META[tier] ?? LOYALTY_META.BRONZE;

  return (
    <>
      <h1>ContractForge – Checkout Preview</h1>
      <p style={{ color: "#555", marginBottom: "1.5rem" }}>
        Browse the catalog with stock and prices; pick a user to instantly see
        their discounted pricing.
      </p>

      {(productsError || usersError) && (
        <div style={errorBoxStyle}>
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

      {/* User picker */}
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
                    border: isActive
                      ? `2px solid ${meta.color}`
                      : "1px solid #dbe2ef",
                    backgroundColor: isActive
                      ? "rgba(13,110,253,0.06)"
                      : "#fff",
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

      {pricingError && <div style={errorBoxStyle}>{pricingError}</div>}

      {/* Product cards */}
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
                    <div
                      style={{
                        color: "#888",
                        textDecoration: "line-through"
                      }}
                    >
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