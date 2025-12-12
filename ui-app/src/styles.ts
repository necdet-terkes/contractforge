// Comprehensive design system for the UI with dark mode support

// Spacing scale: 4, 8, 12, 16, 24, 32, 48
export const spacing = {
  xs: "0.25rem", // 4px
  sm: "0.5rem", // 8px
  md: "0.75rem", // 12px
  lg: "1rem", // 16px
  xl: "1.5rem", // 24px
  "2xl": "2rem", // 32px
  "3xl": "3rem" // 48px
};

// Light theme colors
export const lightColors = {
  primary: "#0d6efd",
  primaryHover: "#0b5ed7",
  primaryBorder: "#0a58ca",
  secondary: "#6c757d",
  danger: "#dc3545",
  success: "#198754",
  warning: "#ffc107",
  info: "#0dcaf0",
  text: {
    primary: "#212529",
    secondary: "#6c757d",
    muted: "#868e96"
  },
  background: {
    primary: "#ffffff",
    secondary: "#f8f9fa",
    tertiary: "#e9ecef"
  },
  border: {
    light: "#e0e0e0",
    medium: "#ced4da",
    dark: "#adb5bd"
  },
  error: {
    bg: "#f8d7da",
    border: "#f5c2c7",
    text: "#842029"
  },
  successMsg: {
    bg: "#d1e7dd",
    border: "#badbcc",
    text: "#0f5132"
  }
};

// Dark theme colors
export const darkColors = {
  primary: "#4dabf7",
  primaryHover: "#339af0",
  primaryBorder: "#228be6",
  secondary: "#868e96",
  danger: "#ff6b6b",
  success: "#51cf66",
  warning: "#ffd43b",
  info: "#66d9ef",
  text: {
    primary: "#f1f3f5",
    secondary: "#ced4da",
    muted: "#adb5bd"
  },
  background: {
    primary: "#1a1d29",
    secondary: "#252836",
    tertiary: "#2d3142"
  },
  border: {
    light: "#3d4153",
    medium: "#4a4f63",
    dark: "#5a5f73"
  },
  error: {
    bg: "#2d1b1b",
    border: "#3d2525",
    text: "#ff8787"
  },
  successMsg: {
    bg: "#1b2d1b",
    border: "#253d25",
    text: "#69db7c"
  }
};

// Get colors based on theme
export const getColors = (theme: "light" | "dark") => {
  return theme === "dark" ? darkColors : lightColors;
};

// Default export for backward compatibility
export const colors = lightColors;

// Typography
export const typography = {
  h1: {
    fontSize: "1.75rem",
    fontWeight: 700,
    lineHeight: 1.2,
    color: colors.text.primary
  },
  h2: {
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.3,
    color: colors.text.primary
  },
  h3: {
    fontSize: "1.25rem",
    fontWeight: 600,
    lineHeight: 1.4,
    color: colors.text.primary
  },
  body: {
    fontSize: "0.95rem",
    lineHeight: 1.5,
    color: colors.text.secondary
  },
  small: {
    fontSize: "0.85rem",
    lineHeight: 1.5,
    color: colors.text.muted
  }
};

// Get styles based on theme
export const getStyles = (theme: "light" | "dark") => {
  const colors = getColors(theme);
  
  return {
    button: {
      primary: {
        padding: spacing.md + " " + spacing.lg,
        borderRadius: "6px",
        border: "1px solid " + colors.primary,
        backgroundColor: colors.primary,
        color: "#fff",
        cursor: "pointer",
        fontSize: "0.9rem",
        fontWeight: 500,
        transition: "all 0.15s ease",
        fontFamily: "inherit"
      } as React.CSSProperties,
      secondary: {
        padding: "0.4rem 0.75rem",
        borderRadius: "6px",
        border: "1px solid " + colors.secondary,
        backgroundColor: colors.background.primary,
        color: colors.secondary,
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 500,
        transition: "all 0.15s ease"
      } as React.CSSProperties,
      danger: {
        padding: "0.4rem 0.75rem",
        borderRadius: "6px",
        border: "1px solid " + colors.danger,
        backgroundColor: colors.background.primary,
        color: colors.danger,
        cursor: "pointer",
        fontSize: "0.85rem",
        fontWeight: 500,
        transition: "all 0.15s ease"
      } as React.CSSProperties
    },
    input: {
      padding: spacing.md + " " + spacing.md,
      borderRadius: "6px",
      border: "1px solid " + colors.border.medium,
      fontSize: "0.9rem",
      backgroundColor: colors.background.primary,
      color: colors.text.primary,
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      fontFamily: "inherit"
    } as React.CSSProperties,
    select: {
      padding: spacing.md + " " + spacing.md,
      borderRadius: "6px",
      border: "1px solid " + colors.border.medium,
      fontSize: "0.9rem",
      backgroundColor: colors.background.primary,
      color: colors.text.primary,
      cursor: "pointer",
      transition: "border-color 0.15s ease, box-shadow 0.15s ease",
      fontFamily: "inherit"
    } as React.CSSProperties,
    form: {
      display: "flex",
      gap: spacing.md,
      flexWrap: "wrap" as const,
      marginBottom: spacing.lg,
      alignItems: "flex-end"
    } as React.CSSProperties,
    card: {
      backgroundColor: colors.background.primary,
      borderRadius: "8px",
      padding: spacing.xl,
      boxShadow: theme === "dark" 
        ? "0 2px 8px rgba(0,0,0,0.3)" 
        : "0 2px 4px rgba(0,0,0,0.08)",
      border: "1px solid " + colors.border.light
    } as React.CSSProperties
  };
};

// Default export for backward compatibility (light theme)
export const styles = getStyles("light");

