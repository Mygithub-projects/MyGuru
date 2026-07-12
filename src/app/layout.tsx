import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
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
        {/* Terapkan tema tersimpan sebelum paint (elak kilat). Guna next/script
            strategy beforeInteractive — disuntik ke HTML awal di pelayan &
            dijalankan sebelum hydration; tidak dirender semula di klien (elak
            amaran React "script tag inside component"). */}
        <Script id="ekoko-theme-init" strategy="beforeInteractive">
          {`try{if(localStorage.getItem('ekoko-theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
