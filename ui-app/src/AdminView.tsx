// src/AdminView.tsx

import React, { useEffect, useState } from "react";
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

const sectionStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  borderRadius: "4px",
  padding: "1rem",
  marginBottom: "1rem"
};

const errorBoxStyle: React.CSSProperties = {
  border: "1px solid #f5c2c7",
  backgroundColor: "#f8d7da",
  color: "#842029",
  padding: "0.5rem 0.75rem",
  borderRadius: "4px",
  marginBottom: "0.75rem"
};

export const AdminView: React.FC = () => {
  // Users
  const [users, setUsers] = useState<UserPart[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    loyaltyTier: "BRONZE" as UserPart["loyaltyTier"]
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

  // ----- Create / Update / Delete handlers -----

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
    // TODO: Replace prompt-based editing with a proper modal in future
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
    // TODO: Replace prompt-based editing with a proper modal in future
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
      const resp = await fetch(
        `${INVENTORY_API_BASE_URL}/products/${product.id}`,
        {
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
        }
      );

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
    // TODO: Replace prompt-based editing with a proper modal in future
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

    try {
      const resp = await fetch(
        `${PRICING_API_BASE_URL}/pricing/rules/${rule.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify(updates)
        }
      );

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
      <section style={sectionStyle}>
        <h2>Users</h2>
        {usersError && <div style={errorBoxStyle}>{usersError}</div>}

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
                loyaltyTier: e.target.value as UserPart["loyaltyTier"]
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
                    <td
                      align="right"
                      style={{
                        display: "flex",
                        gap: "0.35rem",
                        justifyContent: "flex-end"
                      }}
                    >
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
      <section style={sectionStyle}>
        <h2>Products</h2>
        {productsError && <div style={errorBoxStyle}>{productsError}</div>}

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
                    <td
                      align="right"
                      style={{
                        display: "flex",
                        gap: "0.35rem",
                        justifyContent: "flex-end"
                      }}
                    >
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
      <section style={sectionStyle}>
        <h2>Pricing Rules</h2>
        {rulesError && <div style={errorBoxStyle}>{rulesError}</div>}

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
                loyaltyTier: e.target
                  .value as DiscountRule["loyaltyTier"]
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
          <label
            style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}
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
                    <td
                      align="right"
                      style={{
                        display: "flex",
                        gap: "0.35rem",
                        justifyContent: "flex-end"
                      }}
                    >
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