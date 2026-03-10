'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Компонент, който слуша за грешки от Firestore и ги логва,
 * без да блокира зареждането на основното приложение.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handler = (err: FirestorePermissionError) => {
      console.error("Firestore Permission Error detected:", err);
      setError(err);
    };

    errorEmitter.on('permission-error', handler);
    return () => errorEmitter.off('permission-error', handler);
  }, []);

  // Винаги връщаме null, за да не пречим на рендирането на останалите компоненти
  return null;
}
