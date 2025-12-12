import React from 'react';
import { IS_MOCK_MODE } from '../config';
import { spacing, getColors } from '../styles';
import { useTheme } from '../contexts/ThemeContext';

export const MockModeBanner: React.FC = () => {
  const { theme } = useTheme();
  const colors = getColors(theme);

  if (!IS_MOCK_MODE) {
    return null;
  }

  return (
    <div
      data-testid="mock-mode-banner"
      style={{
        backgroundColor: theme === 'dark' ? '#2d5016' : '#d4edda',
        border: `1px solid ${theme === 'dark' ? '#4a7c2a' : '#c3e6cb'}`,
        borderRadius: '6px',
        padding: spacing.md + ' ' + spacing.lg,
        marginBottom: spacing.lg,
        display: 'flex',
        alignItems: 'center',
        gap: spacing.sm,
        color: theme === 'dark' ? '#a3d977' : '#155724',
        fontSize: '0.9rem',
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: '1.2rem' }}>🧪</span>
      <span>
        <strong>Mock Mode Enabled</strong> — APIs served from contract-generated mocks
      </span>
    </div>
  );
};
