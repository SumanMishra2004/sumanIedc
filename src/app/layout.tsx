import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk, Bebas_Neue, Syne, EB_Garamond } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/providers/auth-provider";
import LenisProvider from "@/providers/lenis-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import ConditionalNavbar from "@/components/home/ConditionalNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  preload: false,
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  preload: false,
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});


const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "IEDC | Innovation & Entrepreneurship Development Cell",
    template: "%s | IEDC",
  },
  description:
    "The official portal of the Innovation and Entrepreneurship Development Cell — manage and track journals, conferences, patents, book chapters, grants, achievements, and more.",
  keywords: [
    "IEDC",
    "Innovation and Entrepreneurship Development Cell",
    "research portal",
    "journals",
    "conferences",
    "patents",
    "book chapters",
    "grants",
    "achievements",
    "faculty",
    "student research",
  ],
  authors: [{ name: "IEDC" }],
  creator: "IEDC",
  metadataBase: new URL("https://iedc.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://iedc.vercel.app",
    siteName: "IEDC Portal",
    title: "IEDC | Innovation & Entrepreneurship Development Cell",
    description:
      "Official portal for research output management — journals, conferences, patents, grants, and institutional achievements.",
    images: [
      {
        url: "/iedc-logo.png",
        width: 1200,
        height: 630,
        alt: "IEDC Portal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IEDC | Innovation & Entrepreneurship Development Cell",
    description:
      "Official portal for research output management — journals, conferences, patents, grants, and institutional achievements.",
    images: ["/iedc-logo.png"],
  },
  icons: {
    icon: [
      { url: "/favicon_io/favicon.ico" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/favicon_io/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png",
    other: [
      { rel: "manifest", url: "/favicon_io/site.webmanifest" },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${bebasNeue.variable}  ${syne.variable} ${ebGaramond.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
          storageKey="iedc-theme"
        >
          <AuthProvider>
            <LenisProvider>
              <ConditionalNavbar homePageData={null}>{children}</ConditionalNavbar>
            </LenisProvider>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
