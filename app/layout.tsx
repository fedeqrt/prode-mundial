import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "Prode Mundial 2026",
  description: "Tabla de posiciones del prode del Mundial de Fútbol 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-[#0a0f1a] text-white min-h-screen">
        <header className="border-b border-white/10 bg-black/30 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-opacity">
              <span className="text-2xl">⚽</span>
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Prode Mundial 2026
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="text-white/60 hover:text-white transition-colors">Posiciones</Link>
              <Link href="/partidos" className="text-white/60 hover:text-white transition-colors">Partidos</Link>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-white/5 mt-16 py-6 text-center text-white/20 text-xs">
          Prode Mundial 2026 · Se actualiza cada 5 minutos
        </footer>
      </body>
    </html>
  );
}
