// src/AdminView.tsx

import React, { useState } from "react";
import {
  ProductPart,
  UserPart,
  DiscountRule
} from "./types";
import {
  INVENTORY_API_BASE_URL,
  USER_API_BASE_URL,
  PRICING_API_BASE_URL
} from "./config";
import { useResourceList } from "./hooks/useResourceList";
import { useResourceCRUD } from "./hooks/useResourceCRUD";
import { ResourceSection } from "./components/ResourceSection";
import { ResourceTable } from "./components/ResourceTable";
import { styles } from "./styles";

export const AdminView: React.FC = () => {
  // Users
  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    loyaltyTier: "BRONZE" as UserPart["loyaltyTier"]
  });

  const {
    items: users,
    loading: usersLoading,
    error: usersError,
    reload: reloadUsers
  } = useResourceList<UserPart>({
    fetchFn: async () => {
      const resp = await fetch(`${USER_API_BASE_URL}/users`, {
        headers: { Accept: "application/json" }
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message ?? "Failed to load users");
      }
      return data;
    }
  });

  const {
    create: createUser,
    update: updateUser,
    remove: deleteUser,
    error: userCrudError,
    setError: setUserCrudError
  } = useResourceCRUD({
    createFn: async (data) => {
      const resp = await fetch(`${USER_API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(data)
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? "Failed to create user");
      }
      return result;
    },
    updateFn: async (id, data) => {
      const resp = await fetch(`${USER_API_BASE_URL}/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(data)
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? "Failed to update user");
      }
      return result;
    },
    deleteFn: async (id) => {
      const resp = await fetch(`${USER_API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" }
      });
      if (!resp.ok && resp.status !== 204) {
        const result = await resp.json().catch(() => null);
        throw new Error(result?.message ?? "Failed to delete user");
      }
    },
    onSuccess: reloadUsers
  });

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserCrudError(null);
    try {
      await createUser(newUser);
      setNewUser({ id: "", name: "", loyaltyTier: "BRONZE" });
    } catch (err) {
      // Error already set by hook
    }
  }

  async function handleUpdateUser(user: UserPart) {
    const name = window.prompt("Update name", user.name);
    if (name === null) return;
    const loyalty = window
      .prompt("Update loyalty tier (BRONZE/SILVER/GOLD)", user.loyaltyTier)
      ?.toUpperCase();
    if (loyalty === null) return;

    setUserCrudError(null);
    try {
      await updateUser(user.id, {
        name: name.trim(),
        loyaltyTier: loyalty?.trim() || undefined
      });
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
    id: "",
    name: "",
    stock: 0,
    price: 0
  });

  const {
    items: products,
    loading: productsLoading,
    error: productsError,
    reload: reloadProducts
  } = useResourceList<ProductPart>({
    fetchFn: async () => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products`, {
        headers: { Accept: "application/json" }
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message ?? "Failed to load products");
      }
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock,
        basePrice: p.price
      }));
    }
  });

  const {
    create: createProduct,
    update: updateProduct,
    remove: deleteProduct,
    error: productCrudError,
    setError: setProductCrudError
  } = useResourceCRUD({
    createFn: async (data) => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          id: data.id,
          name: data.name,
          stock: Number(data.stock),
          price: Number(data.price)
        })
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? "Failed to create product");
      }
      return result;
    },
    updateFn: async (id, data) => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name: data.name.trim(),
          stock: data.stock,
          price: data.price
        })
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? "Failed to update product");
      }
      return result;
    },
    deleteFn: async (id) => {
      const resp = await fetch(`${INVENTORY_API_BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Accept: "application/json" }
      });
      if (!resp.ok && resp.status !== 204) {
        const result = await resp.json().catch(() => null);
        throw new Error(result?.message ?? "Failed to delete product");
      }
    },
    onSuccess: reloadProducts
  });

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setProductCrudError(null);
    try {
      await createProduct(newProduct);
      setNewProduct({ id: "", name: "", stock: 0, price: 0 });
    } catch (err) {
      // Error already set by hook
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

    setProductCrudError(null);
    try {
      await updateProduct(product.id, { name, stock, price });
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
    id: "",
    loyaltyTier: "BRONZE" as DiscountRule["loyaltyTier"],
    rate: 0,
    description: "",
    active: true
  });

  const {
    items: rules,
    loading: rulesLoading,
    error: rulesError,
    reload: reloadRules
  } = useResourceList<DiscountRule>({
    fetchFn: async () => {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules`, {
        headers: { Accept: "application/json" }
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.message ?? "Failed to load discount rules");
      }
      return data;
    }
  });

  const {
    create: createRule,
    update: updateRule,
    remove: deleteRule,
    error: ruleCrudError,
    setError: setRuleCrudError
  } = useResourceCRUD({
    createFn: async (data) => {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          id: data.id,
          loyaltyTier: data.loyaltyTier,
          rate: Number(data.rate),
          description: data.description,
          active: data.active
        })
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? "Failed to create discount rule");
      }
      return result;
    },
    updateFn: async (id, data) => {
      const resp = await fetch(`${PRICING_API_BASE_URL}/pricing/rules/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify(data)
      });
      const result = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(result?.message ?? "Failed to update discount rule");
      }
      return result;
    },
    deleteFn: async (id) => {
      const resp = await fetch(
        `${PRICING_API_BASE_URL}/pricing/rules/${id}`,
        {
          method: "DELETE",
          headers: { Accept: "application/json" }
        }
      );
      if (!resp.ok && resp.status !== 204) {
        const result = await resp.json().catch(() => null);
        throw new Error(result?.message ?? "Failed to delete discount rule");
      }
    },
    onSuccess: reloadRules
  });

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    setRuleCrudError(null);
    try {
      await createRule(newRule);
      setNewRule({
        id: "",
        loyaltyTier: "BRONZE",
        rate: 0,
        description: "",
        active: true
      });
    } catch (err) {
      // Error already set by hook
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

    const rateRaw = window.prompt("Update rate (0-1)", String(rule.rate));
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

    const updates: Partial<DiscountRule> = {
      loyaltyTier: (loyaltyInput?.trim() as DiscountRule["loyaltyTier"]) ||
        rule.loyaltyTier,
      rate: rateRaw.trim() === "" ? rule.rate : Number(rateRaw),
      description: description.trim(),
      active:
        activeRaw.trim().toLowerCase() === "true"
          ? true
          : activeRaw.trim().toLowerCase() === "false"
          ? false
          : rule.active
    };

    setRuleCrudError(null);
    try {
      await updateRule(rule.id, updates);
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
      <h1
        style={{
          margin: "0 0 0.5rem 0",
          fontSize: "1.75rem",
          fontWeight: 700,
          color: "#212529"
        }}
      >
        ContractForge – Admin Console
      </h1>
      <p
        style={{
          color: "#6c757d",
          marginBottom: "2rem",
          fontSize: "0.95rem"
        }}
      >
        Manage users, products and pricing rules used by the checkout flow.
      </p>

      {/* USERS */}
      <ResourceSection
        title="Users"
        error={usersError || userCrudError || null}
      >
        <form onSubmit={handleCreateUser} style={styles.form}>
          <input
            placeholder="ID (e.g. u4)"
            value={newUser.id}
            onChange={(e) =>
              setNewUser((prev) => ({ ...prev, id: e.target.value }))
            }
            style={styles.input}
          />
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) =>
              setNewUser((prev) => ({ ...prev, name: e.target.value }))
            }
            style={styles.input}
          />
          <select
            value={newUser.loyaltyTier}
            onChange={(e) =>
              setNewUser((prev) => ({
                ...prev,
                loyaltyTier: e.target.value as UserPart["loyaltyTier"]
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
            disabled={usersLoading}
            onMouseEnter={(e) => {
              if (!usersLoading) {
                e.currentTarget.style.backgroundColor = "#0b5ed7";
                e.currentTarget.style.borderColor = "#0a58ca";
              }
            }}
            onMouseLeave={(e) => {
              if (!usersLoading) {
                e.currentTarget.style.backgroundColor = "#0d6efd";
                e.currentTarget.style.borderColor = "#0d6efd";
              }
            }}
            style={styles.button.primary}
          >
            Add User
          </button>
        </form>

        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <ResourceTable
            items={users}
            loading={usersLoading}
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Name" },
              { key: "loyaltyTier", label: "Tier" }
            ]}
            actions={(user) => (
              <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleUpdateUser(user)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={styles.button.secondary}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8d7da";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={styles.button.danger}
                >
                  Delete
                </button>
              </div>
            )}
            emptyMessage="No users found."
          />
        </div>
      </ResourceSection>

      {/* PRODUCTS */}
      <ResourceSection
        title="Products"
        error={productsError || productCrudError || null}
      >
        <form onSubmit={handleCreateProduct} style={styles.form}>
          <input
            placeholder="ID (e.g. p10)"
            value={newProduct.id}
            onChange={(e) =>
              setNewProduct((prev) => ({ ...prev, id: e.target.value }))
            }
            style={styles.input}
          />
          <input
            placeholder="Name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct((prev) => ({ ...prev, name: e.target.value }))
            }
            style={styles.input}
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
            style={styles.input}
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
            style={styles.input}
          />
          <button
            type="submit"
            disabled={productsLoading}
            onMouseEnter={(e) => {
              if (!productsLoading) {
                e.currentTarget.style.backgroundColor = "#0b5ed7";
                e.currentTarget.style.borderColor = "#0a58ca";
              }
            }}
            onMouseLeave={(e) => {
              if (!productsLoading) {
                e.currentTarget.style.backgroundColor = "#0d6efd";
                e.currentTarget.style.borderColor = "#0d6efd";
              }
            }}
            style={styles.button.primary}
          >
            Add Product
          </button>
        </form>

        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <ResourceTable
            items={products}
            loading={productsLoading}
            columns={[
              { key: "id", label: "ID" },
              { key: "name", label: "Name" },
              {
                key: "stock",
                label: "Stock",
                align: "right",
                render: (p) => String(p.stock)
              },
              {
                key: "basePrice",
                label: "Price",
                align: "right",
                render: (p) => `£${p.basePrice}`
              }
            ]}
            actions={(product) => (
              <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleUpdateProduct(product)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={styles.button.secondary}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteProduct(product.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8d7da";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={styles.button.danger}
                >
                  Delete
                </button>
              </div>
            )}
            emptyMessage="No products found."
          />
        </div>
      </ResourceSection>

      {/* PRICING RULES */}
      <ResourceSection
        title="Pricing Rules"
        error={rulesError || ruleCrudError || null}
      >
        <form onSubmit={handleCreateRule} style={styles.form}>
          <input
            placeholder="Rule ID (e.g. rule-gold-30)"
            value={newRule.id}
            onChange={(e) =>
              setNewRule((prev) => ({ ...prev, id: e.target.value }))
            }
            style={styles.input}
          />
          <select
            value={newRule.loyaltyTier}
            onChange={(e) =>
              setNewRule((prev) => ({
                ...prev,
                loyaltyTier: e.target
                  .value as DiscountRule["loyaltyTier"]
              }))
            }
            style={styles.select}
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
            style={styles.input}
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
            style={styles.input}
          />
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              border: "1px solid #ced4da",
              borderRadius: "6px",
              backgroundColor: "#fff"
            }}
          >
            <input
              type="checkbox"
              checked={newRule.active}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, active: e.target.checked }))
              }
            />
            Active
          </label>
          <button
            type="submit"
            disabled={rulesLoading}
            onMouseEnter={(e) => {
              if (!rulesLoading) {
                e.currentTarget.style.backgroundColor = "#0b5ed7";
                e.currentTarget.style.borderColor = "#0a58ca";
              }
            }}
            onMouseLeave={(e) => {
              if (!rulesLoading) {
                e.currentTarget.style.backgroundColor = "#0d6efd";
                e.currentTarget.style.borderColor = "#0d6efd";
              }
            }}
            style={styles.button.primary}
          >
            Add Rule
          </button>
        </form>

        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          <ResourceTable
            items={rules}
            loading={rulesLoading}
            columns={[
              { key: "id", label: "ID" },
              { key: "loyaltyTier", label: "Tier" },
              {
                key: "rate",
                label: "Rate",
                align: "right",
                render: (r) => String(r.rate)
              },
              {
                key: "description",
                label: "Description",
                render: (r) => r.description || "-"
              },
              {
                key: "active",
                label: "Active",
                align: "center",
                render: (r) => (r.active ? "✅" : "❌")
              }
            ]}
            actions={(rule) => (
              <div style={{ display: "flex", gap: "0.35rem", justifyContent: "flex-end" }}>
                <button
                  onClick={() => handleUpdateRule(rule)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#e9ecef";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={styles.button.secondary}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#f8d7da";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  style={styles.button.danger}
                >
                  Delete
                </button>
              </div>
            )}
            emptyMessage="No discount rules found."
          />
        </div>
      </ResourceSection>
    </>
  );
};
