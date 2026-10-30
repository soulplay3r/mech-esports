import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Rajdhani } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const rajdhani = Rajdhani({ variable: "--font-rajdhani", subsets: ["latin"], weight: ["500", "600", "700"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mech E-Sports — Engineering is a sport",
  description: "Timed mechanical engineering challenges against AI engineering opponents. Compete. Prove. Dominate.",
};

export const viewport: Viewport = { themeColor: "#05070b" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${rajdhani.variable} ${jetbrains.variable} min-h-dvh font-sans`}>
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
