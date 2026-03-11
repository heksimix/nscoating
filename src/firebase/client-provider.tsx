'use client';

import React, { useState, useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// Инициализираме услугите веднага, ако сме в браузъра, за да избегнем "flash of loading"
let globalServices: FirebaseServices | null = null;
if (typeof window !== 'undefined') {
  try {
    globalServices = initializeFirebase();
  } catch (e) {
    console.error("Immediate Firebase init failed:", e);
  }
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices] = useState<FirebaseServices | null>(globalServices);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseServices && typeof window !== 'undefined') {
      try {
        // Fallback ако първоначалната инициализация е била неуспешна
        initializeFirebase();
      } catch (error: any) {
        console.error("Firebase initialization failed in effect:", error);
        setInitError(error.message || "Грешка при свързване с Firebase");
      }
    }
  }, [firebaseServices]);

  if (initError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-4 text-center">
        <h1 className="text-xl font-bold text-destructive mb-2">Грешка при стартиране</h1>
        <p className="text-muted-foreground">{initError}</p>
      </div>
    );
  }

  if (!firebaseServices) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <div>Свързване с услугите...</div>
            </div>
        </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
