// Reusable Card component with consistent styling and dark mode support

import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getColors, spacing } from "../styles";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  className,
  style
}) => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <div
      className={className}
      style={{
        backgroundColor: colors.background.primary,
        borderRadius: "8px",
        padding: spacing.xl,
        boxShadow: theme === "dark" 
          ? "0 2px 8px rgba(0,0,0,0.3)" 
          : "0 2px 4px rgba(0,0,0,0.08)",
        border: "1px solid " + colors.border.light,
        transition: "all 0.2s ease",
        ...style
      }}
    >
      {title && (
        <div style={{ marginBottom: description ? "0.5rem" : spacing.lg }}>
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 600,
              color: colors.text.primary
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                margin: "0.25rem 0 0 0",
                fontSize: "0.9rem",
                color: colors.text.secondary
              }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};
