'use client';

import * as React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AppDataProvider } from '@/hooks/use-app-data';
import { ThemeProvider } from '@/hooks/use-theme';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { UserProvider } from '@/firebase/auth/use-user';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
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
  );
}
