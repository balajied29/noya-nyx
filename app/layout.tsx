import type { Metadata } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Noya by NYX — A cocktail room in Guwahati",
  description:
    "Noya is a cocktail room at Hotel Palacio, Guwahati. A shelf of tinctures made from what grows nearby, and a list that changes when the market does.",
};

const BAR_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  name: "Noya by NYX",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Hotel Palacio, HP Brahmachari Road, Paltan Bazaar",
    addressLocality: "Guwahati",
    addressRegion: "Assam",
    postalCode: "781008",
    addressCountry: "IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(BAR_SCHEMA) }}
        />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
