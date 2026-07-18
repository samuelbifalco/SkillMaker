import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://skillmdmaker.vercel.app"),
  title: "SkillMaker",
  description:
    "An open-source workspace for designing, validating, and exporting SKILL.md and DESIGN.md files.",
  openGraph: {
    title: "SkillMaker",
    description:
      "Design, validate, and export ready-to-use SKILL.md and DESIGN.md files.",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillMaker",
    description:
      "Design, validate, and export ready-to-use SKILL.md and DESIGN.md files.",
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
