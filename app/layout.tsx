import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/seo/json-ld";
import {
  defaultSiteDescription,
  getNormalizedSiteUrl,
  siteName,
} from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getNormalizedSiteUrl()),
  title: {
    default: "ModelRate - AI API Cost & Multiplier Calculator",
    template: "%s | ModelRate",
  },
  description: defaultSiteDescription,
  applicationName: siteName,
  openGraph: {
    title: "ModelRate - AI API Cost & Multiplier Calculator",
    description: defaultSiteDescription,
    url: "/",
    siteName,
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ModelRate - AI API Cost & Multiplier Calculator",
    description: defaultSiteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-50 text-slate-950">
        <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
