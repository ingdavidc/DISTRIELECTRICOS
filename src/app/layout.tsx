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

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
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
        {/* Trampa para portales cautivos: Atrapa el autofocus automático del sistema para que no despliegue el teclado */}
        <input type="text" readOnly tabIndex={-1} style={{ position: "absolute", top: "-9999px", left: "-9999px", opacity: 0 }} aria-hidden="true" />
        
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}
