import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Ollama AI Dashboard",
  description: "Private local AI access, served from the owner's laptop.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
