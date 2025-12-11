// Error message component with consistent styling

import React from "react";

interface ErrorMessageProps {
  message: string | null;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      style={{
        border: "1px solid #f5c2c7",
        backgroundColor: "#f8d7da",
        color: "#842029",
        padding: "0.75rem 1rem",
        borderRadius: "6px",
        marginBottom: "1rem",
        fontSize: "0.9rem"
      }}
    >
      {message}
    </div>
  );
};
