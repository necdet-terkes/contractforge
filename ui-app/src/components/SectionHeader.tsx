// Reusable SectionHeader component for consistent page headers with dark mode support

import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { getColors, spacing } from "../styles";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  action
}) => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <div
      style={{
        marginBottom: spacing.xl,
        display: "flex",
        justifyContent: "space-between",
        alignItems: description ? "flex-start" : "center",
        flexWrap: "wrap",
        gap: spacing.lg
      }}
    >
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "1.75rem",
            fontWeight: 700,
            color: colors.text.primary,
            lineHeight: 1.2
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: spacing.md + " 0 0 0",
              fontSize: "0.95rem",
              color: colors.text.secondary,
              lineHeight: 1.5
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

