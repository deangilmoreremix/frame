import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Frame — AI Video Editor",
  description: "AI-Powered Video Editing with a Code-Like Creative Flow",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#0b0b0f", color: "#eee" }}>
        {children}
      </body>
    </html>
  );
}
