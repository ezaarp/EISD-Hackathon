import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LMS Laboratory - Management System",
  description: "Laboratory Management System dengan UI Pixel Style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-mono">
        {children}
      </body>
    </html>
  );
}
