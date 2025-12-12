// Theme toggle button component with dark mode support

import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getColors, spacing } from "../styles";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const colors = getColors(theme);

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: spacing.md + " " + spacing.lg,
        borderRadius: "6px",
        border: "1px solid " + colors.border.medium,
        backgroundColor: colors.background.primary,
        color: colors.text.primary,
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: 500,
        transition: "all 0.15s ease",
        display: "flex",
        alignItems: "center",
        gap: spacing.sm,
        fontFamily: "inherit"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.background.tertiary;
        e.currentTarget.style.borderColor = colors.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.background.primary;
        e.currentTarget.style.borderColor = colors.border.medium;
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>{theme === "dark" ? "☀️" : "🌙"}</span>
      <span>{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
};

