import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas Training — Seu treino. Sua evolução.",
  description:
    "Plataforma completa para personal trainers e alunos. Treinos, evolução com dados reais, gamificação.",
  applicationName: "Atlas Training",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Atlas",
    statusBarStyle: "black-translucent",
    startupImage: ["/icons/app-icon.png"],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icons/app-icon.png", sizes: "512x512", type: "image/png" }],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
      { url: "/icons/apple-touch-icon.png", sizes: "152x152" },
      { url: "/icons/apple-touch-icon.png", sizes: "120x120" },
    ],
    other: [
      { rel: "apple-touch-icon-precomposed", url: "/icons/apple-touch-icon.png" },
      { rel: "mask-icon", url: "/icons/app-icon.png", color: "#C6FF00" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F0F12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={spaceGrotesk.variable}>
      <head>
        {/* iOS standalone — sem barra de Safari quando lançado da home */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Atlas" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/sw.js").catch(() => {});
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
