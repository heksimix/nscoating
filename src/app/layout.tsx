"use client";

import { Inter } from 'next/font/google'
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppDataProvider } from '@/hooks/use-app-data';
import { ThemeProvider } from '@/hooks/use-theme';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserProvider } from '@/firebase/auth/use-user';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg" suppressHydrationWarning>
      <head>
          <title>Управление на поръчки</title>
          <meta name="description" content="Приложение за управление на поръчки." />
      </head>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <ThemeProvider defaultTheme="light" storageKey="orderly-theme">
          <FirebaseClientProvider>
            <UserProvider>
              <AppDataProvider>
                {children}
              </AppDataProvider>
            </UserProvider>
          </FirebaseClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
