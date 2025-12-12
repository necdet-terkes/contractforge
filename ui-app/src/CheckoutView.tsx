// src/CheckoutView.tsx

import React, { useEffect, useState } from 'react';
import { ProductPart, UserPart, PricingPart } from './types';
import { ORCHESTRATOR_BASE_URL, PRICING_API_BASE_URL, PRODUCT_IMAGE } from './config';
import { Card } from './components/Card';
import { SectionHeader } from './components/SectionHeader';
import { ErrorMessage } from './components/ErrorMessage';
import { Button } from './components/Button';
import { useTheme } from './contexts/ThemeContext';
import { spacing, getColors } from './styles';

const LOYALTY_META: Record<
  'BRONZE' | 'SILVER' | 'GOLD',
  { label: string; desc: string; color: string; bg: string; emoji: string }
> = {
  BRONZE: {
    label: 'Bronze',
    desc: 'Starter tier, light savings',
    color: '#b87333',
    bg: 'rgba(184,115,51,0.12)',
    emoji: '🥉',
  },
  SILVER: {
    label: 'Silver',
    desc: 'Steady perks and better deals',
    color: '#8a8d93',
    bg: 'rgba(138,141,147,0.12)',
    emoji: '🥈',
  },
  GOLD: {
    label: 'Gold',
    desc: 'Top benefits and strongest discounts',
    color: '#d4af37',
    bg: 'rgba(212,175,55,0.12)',
    emoji: '🥇',
  },
};

export const CheckoutView: React.FC = () => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  // Products
  const [products, setProducts] = useState<ProductPart[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Users
  const [users, setUsers] = useState<UserPart[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Pricing per product for selected user
  const [pricingQuotes, setPricingQuotes] = useState<Record<string, PricingPart>>({});
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Load products from orchestrator
  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      setProductsError(null);

      try {
        const resp = await fetch(`${ORCHESTRATOR_BASE_URL}/catalog/products`, {
          headers: { Accept: 'application/json' },
        });

        const data = await resp.json();

        if (!resp.ok) {
          setProductsError(data?.message ?? 'Failed to load products');
          return;
        }

        const mapped: ProductPart[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          basePrice: p.price,
        }));
        setProducts(mapped);
      } catch (err: any) {
        setProductsError(err.message ?? 'Failed to load products');
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
          headers: { Accept: 'application/json' },
        });

        const data = await resp.json();

        if (!resp.ok) {
          setUsersError(data?.message ?? 'Failed to load users');
          return;
        }

        const mapped: UserPart[] = data.map((u: any) => ({
          id: u.id,
          name: u.name,
          loyaltyTier: u.loyaltyTier,
        }));

        setUsers(mapped);
      } catch (err: any) {
        setUsersError(err.message ?? 'Failed to load users');
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
              loyaltyTier: user.loyaltyTier,
            });

            const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/quote?${params.toString()}`, {
              headers: { Accept: 'application/json' },
            });
            const data = await resp.json();
            if (!resp.ok) {
              throw new Error(data?.message ?? 'Failed to calculate pricing');
            }
            return [product.id, data] as const;
          })
        );

        setPricingQuotes(Object.fromEntries(entries));
      } catch (err: any) {
        setPricingError(err.message ?? 'Failed to calculate pricing');
        setPricingQuotes({});
      } finally {
        setPricingLoading(false);
      }
    }

    loadPricingForUser();
  }, [selectedUserId, products, users]);

  const formatPrice = (value: number) => `£${value.toFixed(2)}`;
  const tierStyle = (tier: UserPart['loyaltyTier']) => LOYALTY_META[tier] ?? LOYALTY_META.BRONZE;

  const selectedUser = users.find((u) => u.id === selectedUserId);

  return (
    <>
      <SectionHeader
        title="Checkout Preview"
        description="Browse the catalog with stock and prices; pick a user to instantly see their discounted pricing."
      />

      {(productsError || usersError) && (
        <div style={{ marginBottom: spacing.lg }}>
          {productsError && <ErrorMessage message={productsError} />}
          {usersError && <ErrorMessage message={usersError} />}
        </div>
      )}

      {/* Customer Selection Section */}
      <Card
        title="Customer Selection"
        description="Choose a user to preview loyalty discounts. No selection shows base prices."
        style={{ marginBottom: spacing.xl }}
      >
        {loadingUsers ? (
          <p style={{ margin: 0, color: colors.text.secondary }}>Loading users...</p>
        ) : users.length === 0 ? (
          <p style={{ margin: 0, color: colors.text.muted }}>No users found.</p>
        ) : (
          <>
            {selectedUserId && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: spacing.md,
                  padding: spacing.md,
                  backgroundColor: colors.background.secondary,
                  borderRadius: '6px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: spacing.xs }}>
                    Selected: {selectedUser?.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: colors.text.secondary }}>
                    {selectedUser && (
                      <>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: spacing.xs,
                            color: tierStyle(selectedUser.loyaltyTier).color,
                            backgroundColor: tierStyle(selectedUser.loyaltyTier).bg,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '999px',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                          }}
                        >
                          {tierStyle(selectedUser.loyaltyTier).emoji}{' '}
                          {tierStyle(selectedUser.loyaltyTier).label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUserId('')}
                  data-testid="clear-user-selection"
                >
                  Clear Selection
                </Button>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: spacing.md,
              }}
            >
              {users.map((u) => {
                const meta = tierStyle(u.loyaltyTier);
                const isActive = selectedUserId === u.id;
                return (
                  <button
                    key={u.id}
                    data-testid={`user-select-${u.id}`}
                    onClick={() => setSelectedUserId((prev) => (prev === u.id ? '' : u.id))}
                    style={{
                      textAlign: 'left',
                      border: isActive
                        ? `2px solid ${meta.color}`
                        : '1px solid ' + colors.border.medium,
                      backgroundColor: isActive
                        ? theme === 'dark'
                          ? 'rgba(77,171,247,0.15)'
                          : 'rgba(13,110,253,0.06)'
                        : colors.background.primary,
                      borderRadius: '8px',
                      padding: spacing.md,
                      cursor: 'pointer',
                      boxShadow: isActive
                        ? theme === 'dark'
                          ? '0 4px 12px rgba(0,0,0,0.4)'
                          : '0 4px 12px rgba(0,0,0,0.1)'
                        : theme === 'dark'
                          ? '0 2px 4px rgba(0,0,0,0.3)'
                          : '0 2px 4px rgba(0,0,0,0.05)',
                      transition: 'all 0.15s ease',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = meta.color;
                        e.currentTarget.style.boxShadow =
                          theme === 'dark'
                            ? '0 4px 8px rgba(0,0,0,0.4)'
                            : '0 4px 8px rgba(0,0,0,0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.borderColor = colors.border.medium;
                        e.currentTarget.style.boxShadow =
                          theme === 'dark'
                            ? '0 2px 4px rgba(0,0,0,0.3)'
                            : '0 2px 4px rgba(0,0,0,0.05)';
                      }
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: spacing.sm,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.name}</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: spacing.xs,
                          fontSize: '0.8rem',
                          color: meta.color,
                          backgroundColor: meta.bg,
                          padding: '0.2rem 0.5rem',
                          borderRadius: '999px',
                          fontWeight: 600,
                        }}
                      >
                        {meta.emoji} {meta.label}
                      </span>
                    </div>
                    <div style={{ color: colors.text.muted, fontSize: '0.85rem' }}>ID: {u.id}</div>
                    <div
                      style={{
                        color: colors.text.secondary,
                        marginTop: spacing.xs,
                        fontSize: '0.85rem',
                      }}
                    >
                      {meta.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>

      {pricingError && (
        <div style={{ marginBottom: spacing.lg }}>
          <ErrorMessage message={pricingError} />
        </div>
      )}

      {/* Product Catalog Section */}
      <Card
        title="Product Catalog"
        description={
          selectedUserId && selectedUser
            ? `Showing discounted prices for ${selectedUser.name}`
            : 'Showing base prices. Select a customer to see loyalty discounts.'
        }
      >
        {loadingProducts ? (
          <p style={{ margin: 0, color: colors.text.secondary }}>Loading products...</p>
        ) : products.length === 0 ? (
          <p style={{ margin: 0, color: colors.text.muted }}>No products found.</p>
        ) : (
          <>
            {pricingLoading && selectedUserId && (
              <div
                style={{
                  padding: spacing.md,
                  backgroundColor: colors.background.secondary,
                  borderRadius: '6px',
                  marginBottom: spacing.md,
                  textAlign: 'center',
                  color: colors.text.secondary,
                }}
              >
                Calculating discounts...
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: spacing.lg,
              }}
            >
              {products.map((product) => {
                const quote = pricingQuotes[product.id];
                const discountPercent =
                  quote && quote.basePrice > 0
                    ? Math.round((quote.discount / quote.basePrice) * 100)
                    : 0;
                const hasDiscount = selectedUserId && quote && discountPercent > 0;

                return (
                  <div
                    key={product.id}
                    data-testid={`product-card-${product.id}`}
                    style={{
                      border: '1px solid ' + colors.border.light,
                      borderRadius: '8px',
                      overflow: 'hidden',
                      background: colors.background.primary,
                      boxShadow:
                        theme === 'dark'
                          ? '0 2px 4px rgba(0,0,0,0.3)'
                          : '0 2px 4px rgba(0,0,0,0.05)',
                      transition: 'box-shadow 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        theme === 'dark'
                          ? '0 4px 12px rgba(0,0,0,0.5)'
                          : '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        theme === 'dark'
                          ? '0 2px 4px rgba(0,0,0,0.3)'
                          : '0 2px 4px rgba(0,0,0,0.05)';
                    }}
                  >
                    <div
                      style={{
                        height: '160px',
                        backgroundImage: `url(${PRODUCT_IMAGE})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: colors.background.tertiary,
                      }}
                    />
                    <div style={{ padding: spacing.md }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: spacing.sm,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            color: colors.text.primary,
                          }}
                        >
                          {product.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: product.stock > 0 ? colors.successMsg.text : colors.error.text,
                            backgroundColor:
                              product.stock > 0 ? colors.successMsg.bg : colors.error.bg,
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontWeight: 500,
                          }}
                        >
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: colors.text.muted,
                          marginBottom: spacing.sm,
                        }}
                      >
                        <div>ID: {product.id}</div>
                        <div>Stock: {product.stock} units</div>
                      </div>

                      <div
                        style={{
                          paddingTop: spacing.sm,
                          borderTop: '1px solid ' + colors.border.light,
                        }}
                      >
                        {!selectedUserId || !quote ? (
                          <div>
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: colors.text.muted,
                                marginBottom: spacing.xs,
                              }}
                            >
                              Base Price
                            </div>
                            <div
                              style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: colors.text.primary,
                              }}
                            >
                              {formatPrice(product.basePrice)}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div
                              style={{
                                fontSize: '0.85rem',
                                color: colors.text.muted,
                                marginBottom: spacing.xs,
                              }}
                            >
                              {hasDiscount ? 'Discounted Price' : 'Final Price'}
                            </div>
                            {hasDiscount && (
                              <div
                                style={{
                                  fontSize: '0.9rem',
                                  color: colors.text.muted,
                                  textDecoration: 'line-through',
                                  marginBottom: spacing.xs,
                                }}
                              >
                                {formatPrice(product.basePrice)}
                              </div>
                            )}
                            <div
                              style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: hasDiscount ? colors.successMsg.text : colors.text.primary,
                                marginBottom: spacing.xs,
                              }}
                            >
                              {formatPrice(quote.finalPrice)}
                            </div>
                            {hasDiscount && (
                              <>
                                <div
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: spacing.xs,
                                    color: colors.successMsg.text,
                                    backgroundColor: colors.successMsg.bg,
                                    borderRadius: '999px',
                                    padding: '0.25rem 0.75rem',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    marginBottom: spacing.xs,
                                  }}
                                >
                                  {discountPercent}% OFF
                                </div>
                                <div
                                  style={{
                                    fontSize: '0.8rem',
                                    color: colors.text.muted,
                                    marginTop: spacing.xs,
                                  }}
                                >
                                  You save {formatPrice(quote.discount)}
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </>
  );
};
