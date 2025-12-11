// Reusable table component for resource lists

import React from "react";

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
  if (loading) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#666" }}>
        Loading...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: "1rem", textAlign: "center", color: "#777" }}>
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
              backgroundColor: "#f8f9fa",
              borderBottom: "2px solid #dee2e6"
            }}
          >
            {columns.map((col) => (
              <th
                key={String(col.key)}
                align={col.align || "left"}
                style={{
                  padding: "0.75rem",
                  fontWeight: 600,
                  color: "#495057",
                  textAlign: col.align || "left"
                }}
              >
                {col.label}
              </th>
            ))}
            {actions && <th style={{ padding: "0.75rem", width: "120px" }} />}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr
              key={item.id}
              style={{
                backgroundColor: idx % 2 === 0 ? "#fff" : "#f8f9fa",
                borderBottom: "1px solid #dee2e6",
                transition: "background-color 0.15s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e9ecef";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  idx % 2 === 0 ? "#fff" : "#f8f9fa";
              }}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  align={col.align || "left"}
                  style={{
                    padding: "0.75rem",
                    color: "#212529"
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
                    padding: "0.75rem",
                    textAlign: "right"
                  }}
                >
                  {actions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
