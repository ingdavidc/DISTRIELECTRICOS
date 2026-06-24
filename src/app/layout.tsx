import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Distrielectricos E&D | Eléctricos y más",
  description: "Todo el material eléctrico para tus grandes proyectos. Ideas con energía.",
  openGraph: {
    title: "Distrielectricos E&D | Eléctricos y más",
    description: "Todo el material eléctrico para tus grandes proyectos. Ideas con energía.",
    url: "https://www.distrielectricoseyd.com",
    siteName: "Distrielectricos E&D",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "Distrielectricos E&D Logo",
      },
    ],
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
