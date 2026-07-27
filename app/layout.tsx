import type { Metadata } from "next";
import localFont from "next/font/local";
import Loader from "@/components/Loader";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

/**
 * Host Grotesk, self-hosted.
 *
 * It is not in this Next version's `next/font/google` catalogue, so importing
 * it from there fails to compile. Self-hosting the variable woff2 files works
 * regardless of that catalogue and avoids a third-party request. Host Grotesk
 * is SIL Open Font Licensed, so redistribution with the app is permitted.
 */
const hostGrotesk = localFont({
  src: [
    {
      path: "./fonts/HostGrotesk-Variable.woff2",
      weight: "300 800",
      style: "normal",
    },
    {
      path: "./fonts/HostGrotesk-Italic-Variable.woff2",
      weight: "300 800",
      style: "italic",
    },
  ],
  variable: "--font-host",
  display: "swap",
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
    <html lang="en" className={hostGrotesk.variable}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(BAR_SCHEMA) }}
        />
        <Loader />
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
