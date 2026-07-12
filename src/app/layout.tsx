import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Inter — sans-serif moden bergaya korporat/SaaS, untuk seluruh antara muka.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "KoKurikulum — Sistem Pengurusan Kokurikulum Tingkatan 6",
  description:
    "Pengurusan kokurikulum Tingkatan 6: markah PAJSK, kehadiran & jawatan, e-Cert & analitik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ms" className={`${inter.variable} h-full antialiased`}>
      <head>
        {/* Terapkan tema tersimpan sebelum paint (elak kilat) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('ekoko-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
