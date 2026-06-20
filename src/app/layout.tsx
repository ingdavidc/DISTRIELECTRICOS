import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Distrielectricos E&D | ERP & POS",
  description: "Sistema de gestión omnicanal para ferretería.",
};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
