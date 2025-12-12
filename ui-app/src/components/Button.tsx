// Reusable Button component with consistent styling and dark mode support

import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getColors } from "../styles";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  const baseStyle: React.CSSProperties = {
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: 500,
    transition: "all 0.15s ease",
    border: "1px solid",
    fontFamily: "inherit"
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: "0.375rem 0.75rem", fontSize: "0.85rem" },
    md: { padding: "0.5rem 1rem", fontSize: "0.9rem" },
    lg: { padding: "0.75rem 1.5rem", fontSize: "1rem" }
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      color: "#fff"
    },
    secondary: {
      backgroundColor: colors.background.primary,
      borderColor: colors.secondary,
      color: colors.secondary
    },
    danger: {
      backgroundColor: colors.background.primary,
      borderColor: colors.danger,
      color: colors.danger
    },
    outline: {
      backgroundColor: "transparent",
      borderColor: colors.primary,
      color: colors.primary
    }
  };

  const hoverStyles: Record<string, { backgroundColor: string; borderColor: string }> = {
    primary: { 
      backgroundColor: colors.primaryHover, 
      borderColor: colors.primaryBorder 
    },
    secondary: { 
      backgroundColor: theme === "dark" ? colors.background.tertiary : "#e9ecef", 
      borderColor: colors.secondary 
    },
    danger: { 
      backgroundColor: theme === "dark" ? colors.error.bg : "#f8d7da", 
      borderColor: colors.danger 
    },
    outline: { 
      backgroundColor: theme === "dark" ? colors.background.tertiary : "#e7f1ff", 
      borderColor: colors.primary 
    }
  };

  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...sizeStyles[size],
        ...variantStyles[variant],
        ...style
      }}
      onMouseEnter={(e) => {
        if (!props.disabled) {
          const hover = hoverStyles[variant];
          e.currentTarget.style.backgroundColor = hover.backgroundColor;
          e.currentTarget.style.borderColor = hover.borderColor;
        }
      }}
      onMouseLeave={(e) => {
        if (!props.disabled) {
          const variantStyle = variantStyles[variant];
          e.currentTarget.style.backgroundColor = String(variantStyle.backgroundColor || "");
          e.currentTarget.style.borderColor = String(variantStyle.borderColor || "");
        }
      }}
    >
      {children}
    </button>
  );
};

