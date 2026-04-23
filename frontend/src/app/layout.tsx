import type { Metadata } from "next";
import { Vast_Shadow } from 'next/font/google';
import "./globals.css";
import { Providers } from "@/components/Providers";

const vastShadow = Vast_Shadow({ 
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vast-shadow',
});

export const metadata: Metadata = {
  title: "Node Road",
  description: "Create and share visual learning roadmaps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased ${vastShadow.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
