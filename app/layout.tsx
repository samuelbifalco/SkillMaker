import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://skillsmith.sites.openai.com"),
  title: "Skillsmith",
  description:
    "An AI-assisted workspace for shaping instructions into ready-to-use SKILL.md files.",
  openGraph: {
    title: "Skillsmith",
    description:
      "Shape instructions into ready-to-use SKILL.md files.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Skillsmith",
    description:
      "Shape instructions into ready-to-use SKILL.md files.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
