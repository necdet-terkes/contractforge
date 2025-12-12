// Error message component with consistent styling and dark mode support

import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getColors, spacing } from "../styles";

interface ErrorMessageProps {
  message: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  if (!message) return null;

  return (
    <div
      style={{
        border: "1px solid " + colors.error.border,
        backgroundColor: colors.error.bg,
        color: colors.error.text,
        padding: spacing.md + " " + spacing.lg,
        borderRadius: "6px",
        marginBottom: spacing.lg,
        fontSize: "0.9rem"
      }}
    >
      {message}
    </div>
  );
};

