import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from './providers'
import { AuthButtons } from "@/components/AuthButtons";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Background Remover",
  description: "An interface for removing backgrounds from images using the briaai/RMBG-1.4 model deployed on Akash.",
};

function AppHeader() {
  const pathname = usePathname();
  // Only show header if not on landing page ("/")
  if (pathname === "/") return null;
  return (
    <header className="w-full flex justify-between items-center px-6 py-4 bg-background border-b border-gray-200">
      <div className="font-bold text-xl">BG-Remover</div>
      <AuthButtons />
    </header>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AppHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
