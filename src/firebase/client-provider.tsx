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

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Initialize Firebase on the client side, once per component mount.
      setFirebaseServices(initializeFirebase());
    } catch (error: any) {
      console.error("Firebase initialization failed:", error);
      setInitError(error.message || "Unknown initialization error");
    }
  }, []);

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
            <div>Зареждане на Firebase услуги...</div>
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
