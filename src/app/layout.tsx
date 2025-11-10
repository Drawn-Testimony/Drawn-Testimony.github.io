import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Memorise",
  description: "Memorise",
};

const lato = Lato({ weight: "400", subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={lato.className} lang="en">
      <body className="grid min-h-screen h-screen max-h-screen w-screen max-w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
