import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GÜIDO CAPUZZI",
  description: "GÜIDO CAPUZZI — Denim único sin re-stock. Prendas 1/1.",
  icons: {
    icon: "/assets/images/favicon-32x32.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="state-home">
        {children}
      </body>
    </html>
  );
}
