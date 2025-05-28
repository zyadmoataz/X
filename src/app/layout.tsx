import "./globals.css";
import { ClientAuthWrapper } from "../components/ClientAuthWrapper";
import { AuthProvider } from "../context/AuthContext";

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'X Clone',
  description: 'Full-featured Twitter/X clone with Supabase integration',
}

export default function RootLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal?: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-black text-white">
        <AuthProvider>
          <ClientAuthWrapper>{children}</ClientAuthWrapper>
          {modal}
        </AuthProvider>
      </body>
    </html>
  );
}
