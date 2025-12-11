// Shared styles for the admin interface

export const styles = {
  button: {
    primary: {
      padding: "0.5rem 1rem",
      borderRadius: "6px",
      border: "1px solid #0d6efd",
      backgroundColor: "#0d6efd",
      color: "#fff",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: 500,
      transition: "all 0.15s ease",
      ":hover": {
        backgroundColor: "#0b5ed7",
        borderColor: "#0a58ca"
      },
      ":disabled": {
        opacity: 0.6,
        cursor: "not-allowed"
      }
    } as React.CSSProperties,
    secondary: {
      padding: "0.4rem 0.75rem",
      borderRadius: "6px",
      border: "1px solid #6c757d",
      backgroundColor: "#fff",
      color: "#6c757d",
      cursor: "pointer",
      fontSize: "0.85rem",
      fontWeight: 500,
      transition: "all 0.15s ease",
      marginLeft: "0.35rem"
    } as React.CSSProperties,
    danger: {
      padding: "0.4rem 0.75rem",
      borderRadius: "6px",
      border: "1px solid #dc3545",
      backgroundColor: "#fff",
      color: "#dc3545",
      cursor: "pointer",
      fontSize: "0.85rem",
      fontWeight: 500,
      transition: "all 0.15s ease",
      marginLeft: "0.35rem"
    } as React.CSSProperties
  },
  input: {
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    fontSize: "0.9rem",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease",
    ":focus": {
      outline: "none",
      borderColor: "#86b7fe",
      boxShadow: "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
    }
  } as React.CSSProperties,
  select: {
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    border: "1px solid #ced4da",
    fontSize: "0.9rem",
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "border-color 0.15s ease, box-shadow 0.15s ease"
  } as React.CSSProperties,
  form: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
    marginBottom: "1rem",
    alignItems: "flex-end"
  } as React.CSSProperties
};
