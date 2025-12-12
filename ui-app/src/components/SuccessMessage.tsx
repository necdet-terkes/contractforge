// Success message component with consistent styling and dark mode support

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getColors, spacing } from '../styles';

interface SuccessMessageProps {
  message: string | null;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ message }) => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  if (!message) return null;

  return (
    <div
      style={{
        border: '1px solid ' + colors.successMsg.border,
        backgroundColor: colors.successMsg.bg,
        color: colors.successMsg.text,
        padding: spacing.md + ' ' + spacing.lg,
        borderRadius: '6px',
        marginBottom: spacing.lg,
        fontSize: '0.9rem',
      }}
    >
      {message}
    </div>
  );
};
