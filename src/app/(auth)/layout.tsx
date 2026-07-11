import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "var(--color-background)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      padding: "1rem" 
    }}>
      {children}
    </div>
  );
}
