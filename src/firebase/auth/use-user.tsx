'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useAuth } from '../provider';
import { doc, setDoc, getDoc, getFirestore, serverTimestamp } from 'firebase/firestore';

interface UserContextType {
    user: User | null;
    isLoading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsLoading(false);
        return;
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
        setIsLoading(true);
        if (authUser) {
            const db = getFirestore(auth.app);
            const userRef = doc(db, 'users', authUser.uid);
            
            try {
                // Опитваме се да създадем/обновим потребителския профил само ако правилата позволяват
                const userDoc = await getDoc(userRef);

                if (!userDoc.exists()) {
                    await setDoc(userRef, {
                        uid: authUser.uid,
                        email: authUser.email,
                        displayName: authUser.displayName,
                        photoURL: authUser.photoURL,
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp(),
                    });
                } else {
                    await setDoc(userRef, {
                        lastLogin: serverTimestamp()
                    }, { merge: true });
                }
            } catch (error) {
                console.warn("User profile management restricted by rules or connectivity:", error);
            }

            setUser(authUser);
        } else {
            setUser(null);
        }
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return (
    <UserContext.Provider value={{ user, isLoading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
