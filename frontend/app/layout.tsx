import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Background Remover",
  description: "An interface for removing backgrounds from images using the briaai/RMBG-1.4 model deployed on Akash.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      
      <body className={inter.className}>  <Providers>{children}</Providers></body>
    </html>
  );
}
