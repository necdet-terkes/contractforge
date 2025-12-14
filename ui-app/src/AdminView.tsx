// src/AdminView.tsx

import React, { useState } from 'react';
import { ProductPart, UserPart, DiscountRule } from './types';
import { INVENTORY_API_BASE_URL, USER_API_BASE_URL, PRICING_API_BASE_URL } from './config';
import { useResourceList } from './hooks/useResourceList';
import { useResourceCRUD } from './hooks/useResourceCRUD';
import { ResourceSection } from './components/ResourceSection';
import { ResourceTable } from './components/ResourceTable';
import { Card } from './components/Card';
import { SectionHeader } from './components/SectionHeader';
import { useTheme } from './contexts/ThemeContext';
import { getStyles, spacing, getColors } from './styles';

// Swagger documentation URLs - always point to real API ports
const SWAGGER_URLS = {
  orchestrator: 'http://localhost:4000/docs',
  inventory: 'http://localhost:4001/docs',
  user: 'http://localhost:4002/docs',
  pricing: 'http://localhost:4003/docs',
};

export const AdminView: React.FC = () => {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const colors = getColors(theme);

  // Edit mode states
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Edit form states
  const [editingUserForm, setEditingUserForm] = useState<{
    name: string;
    loyaltyTier: UserPart['loyaltyTier'];
  } | null>(null);
  const [editingProductForm, setEditingProductForm] = useState<{
    name: string;
    stock: number;
    price: number;
  } | null>(null);
  const [editingRuleForm, setEditingRuleForm] = useState<{
    loyaltyTier: DiscountRule['loyaltyTier'];
    rate: number;
    description: string;
    active: boolean;
  } | null>(null);

  // Users
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    loyaltyTier: 'BRONZE' as UserPart['loyaltyTier'],
  });

  const {
    items: users,
    loading: usersLoading,
    error: usersError,
    reload: reloadUsers,
  } = useResourceList<UserPart>({
    fetchFn: async () => {
      const resp = await fetch(`${USER_API_BASE_URL}/users`, {
        headers: { Accept: 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message ?? 'Failed to load users');
      }
      return data;
    },
  });

  const {
    create: createUser,
    update: updateUser,
    remove: deleteUser,
    error: userCrudError,
    setError: setUserCrudError,
  } = useResourceCRUD({
    createFn: async (data) => {
      const resp = await fetch(`${USER_API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? 'Failed to create user');
      }
      return result;
    },
    updateFn: async (id, data) => {
      const resp = await fetch(`${USER_API_BASE_URL}/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? 'Failed to update user');
      }
      return result;
    },
    deleteFn: async (id) => {
      const resp = await fetch(`${USER_API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok && resp.status !== 204) {
        const result = await resp.json().catch(() => null);
        throw new Error(result?.message ?? 'Failed to delete user');
      }
    },
    onSuccess: reloadUsers,
  });

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserCrudError(null);
    try {
      await createUser(newUser);
      setNewUser({ id: '', name: '', loyaltyTier: 'BRONZE' });
    } catch (err) {
      // Error already set by hook
    }
  }

  function handleStartEditUser(user: UserPart) {
    setEditingUserId(user.id);
    setEditingUserForm({
      name: user.name,
      loyaltyTier: user.loyaltyTier,
    });
  }

  function handleCancelEditUser() {
    setEditingUserId(null);
    setEditingUserForm(null);
  }

  async function handleSaveUser(userId: string) {
    if (!editingUserForm) return;

    setUserCrudError(null);
    try {
      await updateUser(userId, {
        name: editingUserForm.name.trim(),
        loyaltyTier: editingUserForm.loyaltyTier,
      });
      setEditingUserId(null);
      setEditingUserForm(null);
    } catch (err) {
      // Error already set by hook
    }
  }

  async function handleDeleteUser(id: string) {
    setUserCrudError(null);
    try {
      await deleteUser(id);
    } catch (err) {
      // Error already set by hook
    }
  }

  // Products
  const [newProduct, setNewProduct] = useState({
    id: '',
    name: '',
    stock: 0,
    price: 0,
  });

  const {
    items: products,
    loading: productsLoading,
    error: productsError,
    reload: reloadProducts,
  } = useResourceList<ProductPart>({
    fetchFn: async () => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products`, {
        headers: { Accept: 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message ?? 'Failed to load products');
      }
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        basePrice: p.price,
      }));
    },
  });

  const {
    create: createProduct,
    update: updateProduct,
    remove: deleteProduct,
    error: productCrudError,
    setError: setProductCrudError,
  } = useResourceCRUD({
    createFn: async (data) => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          stock: Number(data.stock),
          price: Number(data.price),
        }),
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? 'Failed to create product');
      }
      return result;
    },
    updateFn: async (id, data) => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          stock: data.stock,
          price: data.price,
        }),
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? 'Failed to update product');
      }
      return result;
    },
    deleteFn: async (id) => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok && resp.status !== 204) {
        const result = await resp.json().catch(() => null);
        throw new Error(result?.message ?? 'Failed to delete product');
      }
    },
    onSuccess: reloadProducts,
  });

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductCrudError(null);
    try {
      await createProduct(newProduct);
      setNewProduct({ id: '', name: '', stock: 0, price: 0 });
    } catch (err) {
      // Error already set by hook
    }
  }

  function handleStartEditProduct(product: ProductPart) {
    setEditingProductId(product.id);
    setEditingProductForm({
      name: product.name,
      stock: product.stock,
      price: product.basePrice,
    });
  }

  function handleCancelEditProduct() {
    setEditingProductId(null);
    setEditingProductForm(null);
  }

  async function handleSaveProduct(productId: string) {
    if (!editingProductForm) return;

    setProductCrudError(null);
    try {
      await updateProduct(productId, {
        name: editingProductForm.name.trim(),
        stock: editingProductForm.stock,
        price: editingProductForm.price,
      });
      setEditingProductId(null);
      setEditingProductForm(null);
    } catch (err) {
      // Error already set by hook
    }
  }

  async function handleDeleteProduct(id: string) {
    setProductCrudError(null);
    try {
      await deleteProduct(id);
    } catch (err) {
      // Error already set by hook
    }
  }

  // Discount rules
  const [newRule, setNewRule] = useState({
    id: '',
    loyaltyTier: 'BRONZE' as DiscountRule['loyaltyTier'],
    rate: 0,
    description: '',
    active: true,
  });

  const {
    items: rules,
    loading: rulesLoading,
    error: rulesError,
    reload: reloadRules,
  } = useResourceList<DiscountRule>({
    fetchFn: async () => {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules`, {
        headers: { Accept: 'application/json' },
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message ?? 'Failed to load discount rules');
      }
      return data;
    },
  });

  const {
    create: createRule,
    update: updateRule,
    remove: deleteRule,
    error: ruleCrudError,
    setError: setRuleCrudError,
  } = useResourceCRUD({
    createFn: async (data) => {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          id: data.id,
          loyaltyTier: data.loyaltyTier,
          rate: Number(data.rate),
          description: data.description,
          active: data.active,
        }),
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? 'Failed to create discount rule');
      }
      return result;
    },
    updateFn: async (id, data) => {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? 'Failed to update discount rule');
      }
      return result;
    },
    deleteFn: async (id) => {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules/${id}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
      });
      if (!resp.ok && resp.status !== 204) {
        const result = await resp.json().catch(() => null);
        throw new Error(result?.message ?? 'Failed to delete discount rule');
      }
    },
    onSuccess: reloadRules,
  });

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setRuleCrudError(null);
    try {
      await createRule(newRule);
      setNewRule({
        id: '',
        loyaltyTier: 'BRONZE',
        rate: 0,
        description: '',
        active: true,
      });
    } catch (err) {
      // Error already set by hook
    }
  }

  function handleStartEditRule(rule: DiscountRule) {
    setEditingRuleId(rule.id);
    setEditingRuleForm({
      loyaltyTier: rule.loyaltyTier,
      rate: rule.rate,
      description: rule.description || '',
      active: rule.active,
    });
  }

  function handleCancelEditRule() {
    setEditingRuleId(null);
    setEditingRuleForm(null);
  }

  async function handleSaveRule(ruleId: string) {
    if (!editingRuleForm) return;

    setRuleCrudError(null);
    try {
      await updateRule(ruleId, {
        loyaltyTier: editingRuleForm.loyaltyTier,
        rate: editingRuleForm.rate,
        description: editingRuleForm.description.trim(),
        active: editingRuleForm.active,
      });
      setEditingRuleId(null);
      setEditingRuleForm(null);
    } catch (err) {
      // Error already set by hook
    }
  }

  async function handleDeleteRule(id: string) {
    setRuleCrudError(null);
    try {
      await deleteRule(id);
    } catch (err) {
      // Error already set by hook
    }
  }

  return (
    <>
      <SectionHeader
        title="Admin Console"
        description="Manage users, products and pricing rules used by the checkout flow."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 320px',
          gap: spacing.xl,
          alignItems: 'start',
        }}
      >
        {/* Main Content */}
        <div>
          {/* USERS */}
          <ResourceSection title="Users" error={usersError || userCrudError || null}>
            <form onSubmit={handleCreateUser} style={styles.form} data-testid="user-create-form">
              <input
                data-testid="user-id-input"
                placeholder="ID (e.g. u4)"
                value={newUser.id}
                onChange={(e) => setNewUser((prev) => ({ ...prev, id: e.target.value }))}
                style={styles.input}
              />
              <input
                data-testid="user-name-input"
                placeholder="Name"
                value={newUser.name}
                onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                style={styles.input}
              />
              <select
                data-testid="user-tier-select"
                value={newUser.loyaltyTier}
                onChange={(e) =>
                  setNewUser((prev) => ({
                    ...prev,
                    loyaltyTier: e.target.value as UserPart['loyaltyTier'],
                  }))
                }
                style={styles.select}
              >
                <option value="BRONZE">BRONZE</option>
                <option value="SILVER">SILVER</option>
                <option value="GOLD">GOLD</option>
              </select>
              <button
                type="submit"
                data-testid="user-create-button"
                disabled={usersLoading}
                onMouseEnter={(e) => {
                  if (!usersLoading) {
                    const colors = getColors(theme);
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                    e.currentTarget.style.borderColor = colors.primaryBorder;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!usersLoading) {
                    const colors = getColors(theme);
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                style={styles.button.primary}
              >
                Add User
              </button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <ResourceTable
                items={users}
                loading={usersLoading}
                columns={[
                  { key: 'id', label: 'ID' },
                  {
                    key: 'name',
                    label: 'Name',
                    render: (user) => {
                      if (editingUserId === user.id && editingUserForm) {
                        return (
                          <input
                            data-testid={`user-edit-name-${user.id}`}
                            type="text"
                            value={editingUserForm.name}
                            onChange={(e) =>
                              setEditingUserForm((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            style={{
                              ...styles.input,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                            }}
                          />
                        );
                      }
                      return user.name;
                    },
                  },
                  {
                    key: 'loyaltyTier',
                    label: 'Tier',
                    render: (user) => {
                      if (editingUserId === user.id && editingUserForm) {
                        return (
                          <select
                            data-testid={`user-edit-tier-${user.id}`}
                            value={editingUserForm.loyaltyTier}
                            onChange={(e) =>
                              setEditingUserForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      loyaltyTier: e.target.value as UserPart['loyaltyTier'],
                                    }
                                  : null
                              )
                            }
                            style={{
                              ...styles.select,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                            }}
                          >
                            <option value="BRONZE">BRONZE</option>
                            <option value="SILVER">SILVER</option>
                            <option value="GOLD">GOLD</option>
                          </select>
                        );
                      }
                      return user.loyaltyTier;
                    },
                  },
                ]}
                actions={(user) => {
                  if (editingUserId === user.id) {
                    return (
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          data-testid={`user-save-${user.id}`}
                          onClick={() => handleSaveUser(user.id)}
                          onMouseEnter={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.primaryHover;
                            e.currentTarget.style.borderColor = colors.primaryBorder;
                          }}
                          onMouseLeave={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.primary;
                            e.currentTarget.style.borderColor = colors.primary;
                          }}
                          style={styles.button.primary}
                        >
                          Save
                        </button>
                        <button
                          data-testid={`user-cancel-${user.id}`}
                          onClick={handleCancelEditUser}
                          onMouseEnter={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.background.tertiary;
                          }}
                          onMouseLeave={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.background.primary;
                          }}
                          style={styles.button.secondary}
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        data-testid={`user-edit-${user.id}`}
                        onClick={() => handleStartEditUser(user)}
                        onMouseEnter={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.tertiary;
                        }}
                        onMouseLeave={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }}
                        style={styles.button.secondary}
                      >
                        Edit
                      </button>
                      <button
                        data-testid={`user-delete-${user.id}`}
                        onClick={() => handleDeleteUser(user.id)}
                        onMouseEnter={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.error.bg;
                        }}
                        onMouseLeave={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }}
                        style={styles.button.danger}
                      >
                        Delete
                      </button>
                    </div>
                  );
                }}
                emptyMessage="No users found."
              />
            </div>
          </ResourceSection>

          {/* PRODUCTS */}
          <ResourceSection title="Products" error={productsError || productCrudError || null}>
            <form
              onSubmit={handleCreateProduct}
              style={styles.form}
              data-testid="product-create-form"
            >
              <input
                data-testid="product-id-input"
                placeholder="ID (e.g. p10)"
                value={newProduct.id}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, id: e.target.value }))}
                style={styles.input}
              />
              <input
                data-testid="product-name-input"
                placeholder="Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                style={styles.input}
              />
              <input
                data-testid="product-stock-input"
                type="number"
                placeholder="Stock"
                value={newProduct.stock}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    stock: Number(e.target.value),
                  }))
                }
                style={styles.input}
              />
              <input
                data-testid="product-price-input"
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct((prev) => ({
                    ...prev,
                    price: Number(e.target.value),
                  }))
                }
                style={styles.input}
              />
              <button
                type="submit"
                data-testid="product-create-button"
                disabled={productsLoading}
                onMouseEnter={(e) => {
                  if (!productsLoading) {
                    const colors = getColors(theme);
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                    e.currentTarget.style.borderColor = colors.primaryBorder;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!productsLoading) {
                    const colors = getColors(theme);
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                style={styles.button.primary}
              >
                Add Product
              </button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <ResourceTable
                items={products}
                loading={productsLoading}
                columns={[
                  { key: 'id', label: 'ID' },
                  {
                    key: 'name',
                    label: 'Name',
                    render: (product) => {
                      if (editingProductId === product.id && editingProductForm) {
                        return (
                          <input
                            data-testid={`product-edit-name-${product.id}`}
                            type="text"
                            value={editingProductForm.name}
                            onChange={(e) =>
                              setEditingProductForm((prev) =>
                                prev ? { ...prev, name: e.target.value } : null
                              )
                            }
                            style={{
                              ...styles.input,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                            }}
                          />
                        );
                      }
                      return product.name;
                    },
                  },
                  {
                    key: 'stock',
                    label: 'Stock',
                    align: 'right',
                    render: (product) => {
                      if (editingProductId === product.id && editingProductForm) {
                        return (
                          <input
                            data-testid={`product-edit-stock-${product.id}`}
                            type="number"
                            value={editingProductForm.stock}
                            onChange={(e) =>
                              setEditingProductForm((prev) =>
                                prev ? { ...prev, stock: Number(e.target.value) } : null
                              )
                            }
                            style={{
                              ...styles.input,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                              width: '80px',
                            }}
                          />
                        );
                      }
                      return String(product.stock);
                    },
                  },
                  {
                    key: 'basePrice',
                    label: 'Price',
                    align: 'right',
                    render: (product) => {
                      if (editingProductId === product.id && editingProductForm) {
                        return (
                          <input
                            data-testid={`product-edit-price-${product.id}`}
                            type="number"
                            step="0.01"
                            value={editingProductForm.price}
                            onChange={(e) =>
                              setEditingProductForm((prev) =>
                                prev ? { ...prev, price: Number(e.target.value) } : null
                              )
                            }
                            style={{
                              ...styles.input,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                              width: '80px',
                            }}
                          />
                        );
                      }
                      return `£${product.basePrice}`;
                    },
                  },
                ]}
                actions={(product) => {
                  if (editingProductId === product.id) {
                    return (
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          data-testid={`product-save-${product.id}`}
                          onClick={() => handleSaveProduct(product.id)}
                          onMouseEnter={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.primaryHover;
                            e.currentTarget.style.borderColor = colors.primaryBorder;
                          }}
                          onMouseLeave={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.primary;
                            e.currentTarget.style.borderColor = colors.primary;
                          }}
                          style={styles.button.primary}
                        >
                          Save
                        </button>
                        <button
                          data-testid={`product-cancel-${product.id}`}
                          onClick={handleCancelEditProduct}
                          onMouseEnter={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.background.tertiary;
                          }}
                          onMouseLeave={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.background.primary;
                          }}
                          style={styles.button.secondary}
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        data-testid={`product-edit-${product.id}`}
                        onClick={() => handleStartEditProduct(product)}
                        onMouseEnter={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.tertiary;
                        }}
                        onMouseLeave={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }}
                        style={styles.button.secondary}
                      >
                        Edit
                      </button>
                      <button
                        data-testid={`product-delete-${product.id}`}
                        onClick={() => handleDeleteProduct(product.id)}
                        onMouseEnter={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.error.bg;
                        }}
                        onMouseLeave={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }}
                        style={styles.button.danger}
                      >
                        Delete
                      </button>
                    </div>
                  );
                }}
                emptyMessage="No products found."
              />
            </div>
          </ResourceSection>

          {/* PRICING RULES */}
          <ResourceSection title="Pricing Rules" error={rulesError || ruleCrudError || null}>
            <form onSubmit={handleCreateRule} style={styles.form} data-testid="rule-create-form">
              <input
                data-testid="rule-id-input"
                placeholder="Rule ID (e.g. rule-gold-30)"
                value={newRule.id}
                onChange={(e) => setNewRule((prev) => ({ ...prev, id: e.target.value }))}
                style={styles.input}
              />
              <select
                data-testid="rule-tier-select"
                value={newRule.loyaltyTier}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    loyaltyTier: e.target.value as DiscountRule['loyaltyTier'],
                  }))
                }
                style={styles.select}
              >
                <option value="BRONZE">BRONZE</option>
                <option value="SILVER">SILVER</option>
                <option value="GOLD">GOLD</option>
              </select>
              <input
                data-testid="rule-rate-input"
                type="number"
                step="0.01"
                placeholder="Rate (0–1)"
                value={newRule.rate}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    rate: Number(e.target.value),
                  }))
                }
                style={styles.input}
              />
              <input
                data-testid="rule-description-input"
                placeholder="Description (optional)"
                value={newRule.description}
                onChange={(e) =>
                  setNewRule((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                style={styles.input}
              />
              <label
                data-testid="rule-active-checkbox-label"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  backgroundColor: '#fff',
                }}
              >
                <input
                  data-testid="rule-active-checkbox"
                  type="checkbox"
                  checked={newRule.active}
                  onChange={(e) => setNewRule((prev) => ({ ...prev, active: e.target.checked }))}
                />
                Active
              </label>
              <button
                type="submit"
                data-testid="rule-create-button"
                disabled={rulesLoading}
                onMouseEnter={(e) => {
                  if (!rulesLoading) {
                    const colors = getColors(theme);
                    e.currentTarget.style.backgroundColor = colors.primaryHover;
                    e.currentTarget.style.borderColor = colors.primaryBorder;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!rulesLoading) {
                    const colors = getColors(theme);
                    e.currentTarget.style.backgroundColor = colors.primary;
                    e.currentTarget.style.borderColor = colors.primary;
                  }
                }}
                style={styles.button.primary}
              >
                Add Rule
              </button>
            </form>

            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <ResourceTable
                items={rules}
                loading={rulesLoading}
                columns={[
                  { key: 'id', label: 'ID' },
                  {
                    key: 'loyaltyTier',
                    label: 'Tier',
                    render: (rule) => {
                      if (editingRuleId === rule.id && editingRuleForm) {
                        return (
                          <select
                            data-testid={`rule-edit-tier-${rule.id}`}
                            value={editingRuleForm.loyaltyTier}
                            onChange={(e) =>
                              setEditingRuleForm((prev) =>
                                prev
                                  ? {
                                      ...prev,
                                      loyaltyTier: e.target.value as DiscountRule['loyaltyTier'],
                                    }
                                  : null
                              )
                            }
                            style={{
                              ...styles.select,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                            }}
                          >
                            <option value="BRONZE">BRONZE</option>
                            <option value="SILVER">SILVER</option>
                            <option value="GOLD">GOLD</option>
                          </select>
                        );
                      }
                      return rule.loyaltyTier;
                    },
                  },
                  {
                    key: 'rate',
                    label: 'Rate',
                    align: 'right',
                    render: (rule) => {
                      if (editingRuleId === rule.id && editingRuleForm) {
                        return (
                          <input
                            data-testid={`rule-edit-rate-${rule.id}`}
                            type="number"
                            step="0.01"
                            value={editingRuleForm.rate}
                            onChange={(e) =>
                              setEditingRuleForm((prev) =>
                                prev ? { ...prev, rate: Number(e.target.value) } : null
                              )
                            }
                            style={{
                              ...styles.input,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                              width: '80px',
                            }}
                          />
                        );
                      }
                      return String(rule.rate);
                    },
                  },
                  {
                    key: 'description',
                    label: 'Description',
                    render: (rule) => {
                      if (editingRuleId === rule.id && editingRuleForm) {
                        return (
                          <input
                            data-testid={`rule-edit-description-${rule.id}`}
                            type="text"
                            value={editingRuleForm.description}
                            onChange={(e) =>
                              setEditingRuleForm((prev) =>
                                prev ? { ...prev, description: e.target.value } : null
                              )
                            }
                            style={{
                              ...styles.input,
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.9rem',
                            }}
                          />
                        );
                      }
                      return rule.description || '-';
                    },
                  },
                  {
                    key: 'active',
                    label: 'Active',
                    align: 'center',
                    render: (rule) => {
                      if (editingRuleId === rule.id && editingRuleForm) {
                        return (
                          <input
                            data-testid={`rule-edit-active-${rule.id}`}
                            type="checkbox"
                            checked={editingRuleForm.active}
                            onChange={(e) =>
                              setEditingRuleForm((prev) =>
                                prev ? { ...prev, active: e.target.checked } : null
                              )
                            }
                            style={{ cursor: 'pointer' }}
                          />
                        );
                      }
                      return rule.active ? '✅' : '❌';
                    },
                  },
                ]}
                actions={(rule) => {
                  if (editingRuleId === rule.id) {
                    return (
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          data-testid={`rule-save-${rule.id}`}
                          onClick={() => handleSaveRule(rule.id)}
                          onMouseEnter={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.primaryHover;
                            e.currentTarget.style.borderColor = colors.primaryBorder;
                          }}
                          onMouseLeave={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.primary;
                            e.currentTarget.style.borderColor = colors.primary;
                          }}
                          style={styles.button.primary}
                        >
                          Save
                        </button>
                        <button
                          data-testid={`rule-cancel-${rule.id}`}
                          onClick={handleCancelEditRule}
                          onMouseEnter={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.background.tertiary;
                          }}
                          onMouseLeave={(e) => {
                            const colors = getColors(theme);
                            e.currentTarget.style.backgroundColor = colors.background.primary;
                          }}
                          style={styles.button.secondary}
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      <button
                        data-testid={`rule-edit-${rule.id}`}
                        onClick={() => handleStartEditRule(rule)}
                        onMouseEnter={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.tertiary;
                        }}
                        onMouseLeave={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }}
                        style={styles.button.secondary}
                      >
                        Edit
                      </button>
                      <button
                        data-testid={`rule-delete-${rule.id}`}
                        onClick={() => handleDeleteRule(rule.id)}
                        onMouseEnter={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.error.bg;
                        }}
                        onMouseLeave={(e) => {
                          const colors = getColors(theme);
                          e.currentTarget.style.backgroundColor = colors.background.primary;
                        }}
                        style={styles.button.danger}
                      >
                        Delete
                      </button>
                    </div>
                  );
                }}
                emptyMessage="No discount rules found."
              />
            </div>
          </ResourceSection>
        </div>

        {/* Sidebar with API Documentation */}
        <div style={{ position: 'sticky', top: spacing.lg }}>
          <Card title="API Documentation" description="Swagger documentation for all services">
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.md,
              }}
            >
              <a
                href={SWAGGER_URLS.orchestrator}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: '6px',
                  border: '1px solid ' + colors.border.light,
                  textDecoration: 'none',
                  color: colors.text.primary,
                  backgroundColor: colors.background.primary,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.primary;
                  e.currentTarget.style.borderColor = colors.border.light;
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>📚</span>
                <div>
                  <div style={{ fontWeight: 500, color: colors.text.primary }}>
                    Orchestrator API
                  </div>
                  <div style={{ fontSize: '0.85rem', color: colors.text.secondary }}>Port 4000</div>
                </div>
              </a>

              <a
                href={SWAGGER_URLS.inventory}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: '6px',
                  border: '1px solid ' + colors.border.light,
                  textDecoration: 'none',
                  color: colors.text.primary,
                  backgroundColor: colors.background.primary,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.primary;
                  e.currentTarget.style.borderColor = colors.border.light;
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>📦</span>
                <div>
                  <div style={{ fontWeight: 500, color: colors.text.primary }}>Inventory API</div>
                  <div style={{ fontSize: '0.85rem', color: colors.text.secondary }}>Port 4001</div>
                </div>
              </a>

              <a
                href={SWAGGER_URLS.user}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: '6px',
                  border: '1px solid ' + colors.border.light,
                  textDecoration: 'none',
                  color: colors.text.primary,
                  backgroundColor: colors.background.primary,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.primary;
                  e.currentTarget.style.borderColor = colors.border.light;
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>👤</span>
                <div>
                  <div style={{ fontWeight: 500, color: colors.text.primary }}>User API</div>
                  <div style={{ fontSize: '0.85rem', color: colors.text.secondary }}>Port 4002</div>
                </div>
              </a>

              <a
                href={SWAGGER_URLS.pricing}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.md,
                  borderRadius: '6px',
                  border: '1px solid ' + colors.border.light,
                  textDecoration: 'none',
                  color: colors.text.primary,
                  backgroundColor: colors.background.primary,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.secondary;
                  e.currentTarget.style.borderColor = colors.primary;
                }}
                onMouseLeave={(e) => {
                  const colors = getColors(theme);
                  e.currentTarget.style.backgroundColor = colors.background.primary;
                  e.currentTarget.style.borderColor = colors.border.light;
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>💰</span>
                <div>
                  <div style={{ fontWeight: 500, color: colors.text.primary }}>Pricing API</div>
                  <div style={{ fontSize: '0.85rem', color: colors.text.secondary }}>Port 4003</div>
                </div>
              </a>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};
