// Overview/Dashboard page for ContractForge

import React from "react";
import { Card } from "./components/Card";
import { Button } from "./components/Button";
import { SectionHeader } from "./components/SectionHeader";
import { useTheme } from "./contexts/ThemeContext";
import { spacing, getColors } from "./styles";

interface OverviewViewProps {
  onNavigate?: (tab: "checkout" | "admin") => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { theme } = useTheme();
  const colors = getColors(theme);
  
  return (
    <>
      <SectionHeader
        title="ContractForge System Overview"
        description="A contract-driven microservices POC demonstrating inventory management, user loyalty tiers, and dynamic pricing rules."
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: spacing.xl,
          marginBottom: spacing.xl
        }}
      >
        <Card
          title="Inventory Service"
          description="Manages product catalog, stock levels, and pricing"
        >
          <div style={{ marginTop: spacing.lg }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: colors.text.secondary }}>
              <strong>Features:</strong>
            </p>
            <ul style={{ margin: spacing.sm + " 0 0 0", paddingLeft: "1.25rem", color: colors.text.secondary }}>
              <li>Product CRUD operations</li>
              <li>Stock management</li>
              <li>Base price tracking</li>
            </ul>
          </div>
        </Card>

        <Card
          title="User Service"
          description="Manages user accounts and loyalty tier assignments"
        >
          <div style={{ marginTop: spacing.lg }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: colors.text.secondary }}>
              <strong>Loyalty Tiers:</strong>
            </p>
            <ul style={{ margin: spacing.sm + " 0 0 0", paddingLeft: "1.25rem", color: colors.text.secondary }}>
              <li>🥉 Bronze - Starter tier</li>
              <li>🥈 Silver - Better deals</li>
              <li>🥇 Gold - Maximum discounts</li>
            </ul>
          </div>
        </Card>

        <Card
          title="Pricing Service"
          description="Calculates dynamic pricing based on loyalty tiers"
        >
          <div style={{ marginTop: spacing.lg }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: colors.text.secondary }}>
              <strong>Features:</strong>
            </p>
            <ul style={{ margin: spacing.sm + " 0 0 0", paddingLeft: "1.25rem", color: colors.text.secondary }}>
              <li>Discount rule management</li>
              <li>Real-time price calculation</li>
              <li>Tier-based pricing</li>
            </ul>
          </div>
        </Card>

        <Card
          title="Orchestrator Service"
          description="Coordinates requests across all microservices"
        >
          <div style={{ marginTop: spacing.lg }}>
            <p style={{ margin: 0, fontSize: "0.9rem", color: colors.text.secondary }}>
              <strong>Capabilities:</strong>
            </p>
            <ul style={{ margin: spacing.sm + " 0 0 0", paddingLeft: "1.25rem", color: colors.text.secondary }}>
              <li>Catalog aggregation</li>
              <li>Checkout preview orchestration</li>
              <li>Service coordination</li>
            </ul>
          </div>
        </Card>
      </div>

      <Card
        title="Quick Navigation"
        description="Access different parts of the system"
      >
        <div
          style={{
            display: "flex",
            gap: spacing.md,
            flexWrap: "wrap",
            marginTop: spacing.lg
          }}
        >
          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate?.("checkout")}
          >
            Go to Checkout
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => onNavigate?.("admin")}
          >
            Go to Admin Panel
          </Button>
        </div>
        <p style={{ marginTop: spacing.lg, fontSize: "0.85rem", color: colors.text.muted }}>
          Use the navigation tabs above to switch between Overview, Checkout Preview, and Admin Console.
        </p>
      </Card>

      <Card
        title="System Status"
        description="Current service availability"
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: spacing.md,
            marginTop: spacing.lg
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
              <span style={{ fontSize: "1.25rem" }}>🟢</span>
              <span style={{ fontWeight: 500 }}>Orchestrator API</span>
            </div>
            <p style={{ margin: spacing.xs + " 0 0 0", fontSize: "0.85rem", color: colors.text.muted }}>
              Port 4000
            </p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
              <span style={{ fontSize: "1.25rem" }}>🟢</span>
              <span style={{ fontWeight: 500 }}>Inventory API</span>
            </div>
            <p style={{ margin: spacing.xs + " 0 0 0", fontSize: "0.85rem", color: colors.text.muted }}>
              Port 4001
            </p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
              <span style={{ fontSize: "1.25rem" }}>🟢</span>
              <span style={{ fontWeight: 500 }}>User API</span>
            </div>
            <p style={{ margin: spacing.xs + " 0 0 0", fontSize: "0.85rem", color: colors.text.muted }}>
              Port 4002
            </p>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: spacing.sm }}>
              <span style={{ fontSize: "1.25rem" }}>🟢</span>
              <span style={{ fontWeight: 500 }}>Pricing API</span>
            </div>
            <p style={{ margin: spacing.xs + " 0 0 0", fontSize: "0.85rem", color: colors.text.muted }}>
              Port 4003
            </p>
          </div>
        </div>
        <p style={{ marginTop: spacing.lg, fontSize: "0.85rem", color: colors.text.muted, fontStyle: "italic" }}>
          Status indicators are static for demonstration purposes.
        </p>
      </Card>
    </>
  );
};

