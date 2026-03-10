'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Компонент, който слуша за грешки от Firestore (като липса на права)
 * и ги предава на Next.js грешките, за да бъдат лесно откриваеми по време на разработка.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handler = (err: FirestorePermissionError) => {
      setError(err);
    };

    errorEmitter.on('permission-error', handler);
    return () => errorEmitter.off('permission-error', handler);
  }, []);

  if (error) {
    // Хвърляме грешката, за да активираме Next.js error overlay
    throw error;
  }

  return null;
}
