// Reusable section component for resource management

import React from "react";
import { ErrorMessage } from "./ErrorMessage";

interface ResourceSectionProps {
  title: string;
  error: string | null;
  children: React.ReactNode;
}

export const ResourceSection: React.FC<ResourceSectionProps> = ({
  title,
  error,
  children
}) => {
  return (
    <section
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "8px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
      }}
    >
      <h2
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1.25rem",
          fontWeight: 600,
          color: "#212529",
          borderBottom: "2px solid #e9ecef",
          paddingBottom: "0.5rem"
        }}
      >
        {title}
      </h2>
      <ErrorMessage message={error} />
      {children}
    </section>
  );
};
