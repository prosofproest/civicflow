import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { AuthProvider } from "@/lib/auth/auth-context";
import { CivicAssistant } from "@/components/assistant/CivicAssistant";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${plusJakartaSans.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans bg-white text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          {children}
          <CivicAssistant />
        </AuthProvider>
      </body>
    </html>
  );
}
