// Reusable section component for resource management with dark mode support

import React from 'react';
import { ErrorMessage } from './ErrorMessage';
import { useTheme } from '../contexts/ThemeContext';
import { getColors, spacing } from '../styles';

interface ResourceSectionProps {
  title: string;
  error: string | null;
  children: React.ReactNode;
}

export const ResourceSection: React.FC<ResourceSectionProps> = ({ title, error, children }) => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  return (
    <section
      style={{
        border: '1px solid ' + colors.border.light,
        borderRadius: '8px',
        padding: spacing.xl,
        marginBottom: spacing.xl,
        backgroundColor: colors.background.primary,
        boxShadow: theme === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
      }}
    >
      <h2
        style={{
          margin: '0 0 ' + spacing.lg + ' 0',
          fontSize: '1.25rem',
          fontWeight: 600,
          color: colors.text.primary,
          borderBottom: '2px solid ' + colors.border.medium,
          paddingBottom: spacing.md,
        }}
      >
        {title}
      </h2>
      <ErrorMessage message={error} />
      {children}
    </section>
  );
};
