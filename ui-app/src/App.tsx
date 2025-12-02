// src/App.tsx

import React, { useState } from "react";
import { CheckoutView } from "./CheckoutView";
import { AdminView } from "./AdminView";

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