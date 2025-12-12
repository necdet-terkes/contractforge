// src/App.tsx

import React, { useState } from 'react';
import { CheckoutView } from './CheckoutView';
import { AdminView } from './AdminView';
import { OverviewView } from './OverviewView';
import { ThemeToggle } from './components/ThemeToggle';
import { useTheme } from './contexts/ThemeContext';
import { spacing, getColors } from './styles';

type Tab = 'overview' | 'checkout' | 'admin';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { theme } = useTheme();
  const colors = getColors(theme);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '🏠' },
    { id: 'checkout', label: 'Checkout', icon: '🛒' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <div
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: spacing.xl + ' ' + spacing.lg,
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundColor: colors.background.secondary,
        minHeight: '100vh',
        color: colors.text.primary,
        transition: 'background-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Header */}
      <header
        style={{
          marginBottom: spacing.xl,
          paddingBottom: spacing.lg,
          borderBottom: '2px solid ' + colors.border.medium,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 ' + spacing.md + ' 0',
              fontSize: '2rem',
              fontWeight: 700,
              color: colors.text.primary,
            }}
          >
            ContractForge
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '0.95rem',
              color: colors.text.secondary,
            }}
          >
            Contract-driven microservices POC
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: spacing.sm,
          marginBottom: spacing.xl,
          borderBottom: '2px solid ' + colors.border.medium,
          paddingBottom: spacing.md,
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: spacing.md + ' ' + spacing.lg,
                borderRadius: '6px 6px 0 0',
                border: 'none',
                borderBottom: isActive ? '3px solid ' + colors.primary : '3px solid transparent',
                backgroundColor: isActive ? colors.background.primary : 'transparent',
                color: isActive ? colors.primary : colors.text.secondary,
                cursor: 'pointer',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.95rem',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm,
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = colors.text.primary;
                  e.currentTarget.style.backgroundColor = colors.background.tertiary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = colors.text.secondary;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid ' + colors.primary;
                e.currentTarget.style.outlineOffset = '2px';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <div
        style={{
          backgroundColor: colors.background.primary,
          borderRadius: '8px',
          padding: spacing.xl,
          boxShadow: theme === 'dark' ? '0 2px 12px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
        }}
      >
        {activeTab === 'overview' && <OverviewView onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'checkout' && <CheckoutView />}
        {activeTab === 'admin' && <AdminView />}
      </div>
    </div>
  );
};
