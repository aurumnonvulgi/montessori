import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import IOSHideMenuBridge from "./components/IOSHideMenuBridge";
import ActivityTelemetryBridge from "./components/ActivityTelemetryBridge";
import FeedbackWidget from "./components/FeedbackWidget";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Montessori Digital Studio",
  description: "A playful Montessori materials lab with 3D learning.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/MDS.png", type: "image/png", sizes: "680x680" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Montessori DS",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#f5efe6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      </head>
      <body className={`${fraunces.variable} ${manrope.variable} antialiased`}>
        <IOSHideMenuBridge />
        <ActivityTelemetryBridge />
        {children}
        <FeedbackWidget />
      </body>
    </html>
  );
}
