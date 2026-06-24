import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.distrielectricoseyd.com"),
  title: "Distrielectricos E&D | Eléctricos y más",
  description: "Todo el material eléctrico para tus grandes proyectos. Ideas con energía.",
  openGraph: {
    title: "Distrielectricos E&D | Eléctricos y más",
    description: "Todo el material eléctrico para tus grandes proyectos. Ideas con energía.",
    url: "https://www.distrielectricoseyd.com",
    siteName: "Distrielectricos E&D",
    locale: "es_CO",
    type: "website",
  },
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
