// Reusable table component for resource lists with dark mode support

import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getColors, spacing } from "../styles";

interface Column<T> {
  key: keyof T | string;
  label: string;
  align?: "left" | "right" | "center";
  render?: (item: T) => React.ReactNode;
}

interface ResourceTableProps<T> {
  items: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  loading?: boolean;
  emptyMessage?: string;
}

export function ResourceTable<T extends { id: string }>({
  items,
  columns,
  actions,
  loading,
  emptyMessage = "No items found."
}: ResourceTableProps<T>) {
  const { theme } = useTheme();
  const colors = getColors(theme);

  if (loading) {
    return (
      <div style={{ padding: spacing.lg, textAlign: "center", color: colors.text.secondary }}>
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: spacing.lg, textAlign: "center", color: colors.text.muted }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.9rem"
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: colors.background.secondary,
              borderBottom: "2px solid " + colors.border.medium
            }}
          >
            {columns.map((col) => (
              <th
                key={String(col.key)}
                align={col.align || "left"}
                style={{
                  padding: spacing.md,
                  fontWeight: 600,
                  color: colors.text.primary,
                  textAlign: col.align || "left"
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ padding: spacing.md, width: "120px" }} />}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const baseBg = idx % 2 === 0 
              ? colors.background.primary 
              : colors.background.secondary;
            return (
              <tr
                key={item.id}
                style={{
                  backgroundColor: baseBg,
                  borderBottom: "1px solid " + colors.border.light,
                  transition: "background-color 0.15s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = baseBg;
                }}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    align={col.align || "left"}
                    style={{
                      padding: spacing.md,
                      color: colors.text.primary
                    }}
                  >
                    {col.render
                      ? col.render(item)
                      : String(item[col.key as keyof T] ?? "")}
                  </td>
                ))}
                {actions && (
                  <td
                    style={{
                      padding: spacing.md,
                      textAlign: "right"
                    }}
                  >
                    {actions(item)}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
