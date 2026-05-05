import * as Sentry from "@sentry/nextjs";
import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "./providers";

export function generateMetadata(): Metadata {
  return {
    title: "DeckScore — AI Pitch Deck Analysis",
    description:
      "Upload your pitch deck and get an instant AI analysis across 8 key investor evaluation criteria. Free.",
    openGraph: {
      title: "DeckScore — AI Pitch Deck Analysis",
      description:
        "Know if your deck is investor-ready before you hit send. AI analysis in 60 seconds.",
      type: "website",
    },
    other: {
      ...Sentry.getTraceData(),
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
