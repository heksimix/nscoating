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
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const services = initializeFirebase();
      setFirebaseServices(services);
    } catch (error: any) {
      console.error("Firebase initialization failed:", error);
      setInitError(error.message || "Грешка при свързване с Firebase");
    }
  }, []);

  // В Next.js е критично първият рендер на клиента да съвпада със сървъра
  // Затова докато не се монтира компонента и услугите не са готови, показваме консистентно състояние
  if (!isMounted || !firebaseServices) {
    if (initError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center p-4 text-center">
          <h1 className="text-xl font-bold text-destructive mb-2">Грешка при стартиране</h1>
          <p className="text-muted-foreground">{initError}</p>
        </div>
      );
    }

    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                <div>Зареждане...</div>
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
