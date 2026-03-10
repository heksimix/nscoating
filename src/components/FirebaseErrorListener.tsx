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
      console.error("Firestore Permission Error detected:", err);
      setError(err);
    };

    errorEmitter.on('permission-error', handler);
    return () => errorEmitter.off('permission-error', handler);
  }, []);

  if (error) {
    // Вече не хвърляме грешката директно тук, за да не сриваме целия React tree,
    // а я оставяме в състоянието или я логваме за диагностика.
    return null;
  }

  return null;
}
