
'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Order, Client, OrderFormData, FixedExpense, MonthlyExpense, VariableExpense, VariableExpenseFormData, MonthlyIncome, FixedExpenseFormData } from '@/lib/schemas';
import { format } from 'date-fns';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { collection, doc, addDoc, setDoc, deleteDoc, Timestamp, getDoc, onSnapshot, query, where, writeBatch } from 'firebase/firestore';

interface AppDataContextType {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  clients: Client[];
  fixedExpenses: FixedExpense[];
  monthlyExpenses: MonthlyExpense[];
  variableExpenses: VariableExpense[];
  monthlyIncomes: MonthlyIncome[];
  isDataLoaded: boolean;
  addOrder: (orderData: OrderFormData) => void;
  updateOrder: (orderUpdate: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  addClient: (clientData: Omit<Client, 'id'>) => Promise<Client | null>;
  updateClient: (clientData: Client) => void;
  deleteClient: (clientId: string) => void;
  addFixedExpense: (expenseData: FixedExpenseFormData) => Promise<FixedExpense | null>;
  updateFixedExpense: (expenseData: Partial<FixedExpense> & { id: string }) => void;
  deleteFixedExpense: (expenseId: string) => void;
  updateMonthlyExpense: (expenseId: string, month: Date, amount: number, templateInfo?: Partial<FixedExpense>) => void;
  deleteMonthlyExpense: (expenseId: string, month: Date) => void;
  addVariableExpense: (expenseData: VariableExpenseFormData) => void;
  updateVariableExpense: (expenseData: VariableExpense) => void;
  deleteVariableExpense: (expenseId: string) => void;
  updateMonthlyIncome: (month: Date, type: 'bank' | 'cash', amount: number) => void;
  addMultipleOrdersAndClients: (importedOrders: any[]) => Promise<void>;
  addMultipleExpensesAndIncomes: (importedData: any) => Promise<void>;
}

const AppDataContext = React.createContext<AppDataContextType | null>(null);

const fromFirestoreTimestamp = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    const d = new Date(timestamp);
    return isNaN(d.getTime()) ? null : d;
}

const sanitizeForFirestore = (data: any): any => {
  if (data === undefined) return null;
  if (data instanceof Date) {
    if (isNaN(data.getTime())) return null;
    return Timestamp.fromDate(data);
  }
  if (Array.isArray(data)) return data.map(sanitizeForFirestore);
  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const key in data) sanitized[key] = sanitizeForFirestore(data[key]);
    return sanitized;
  }
  return data;
};

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [fixedExpenses, setFixedExpenses] = React.useState<FixedExpense[]>([]);
  const [monthlyExpenses, setMonthlyExpenses] = React.useState<MonthlyExpense[]>([]);
  const [variableExpenses, setVariableExpenses] = React.useState<VariableExpense[]>([]);
  const [monthlyIncomes, setMonthlyIncomes] = React.useState<MonthlyIncome[]>([]);
  const [isDataLoaded, setIsDataLoaded] = React.useState(false);
  const { toast } = useToast();
  const { user, isLoading: isUserLoading } = useUser();
  
  React.useEffect(() => {
    if (isUserLoading || !db) return;
    if (!user) {
      setOrders([]); setClients([]); setFixedExpenses([]); setMonthlyExpenses([]); setVariableExpenses([]); setMonthlyIncomes([]);
      setIsDataLoaded(true);
      return;
    }

    let isMounted = true;
    const unsubscribers: (() => void)[] = [];

    const initializeAndListen = async () => {
        if (!isMounted) return;
        setIsDataLoaded(false);

        const collections: { name: string, setter: Function, processor: (doc: any) => any }[] = [
            { name: 'orders', setter: setOrders, processor: (d) => ({
                ...d.data(), id: d.id,
                receivedDate: fromFirestoreTimestamp(d.data().receivedDate) || new Date(),
                paymentDate: d.data().paymentDate ? fromFirestoreTimestamp(d.data().paymentDate) : undefined,
                items: (d.data().items || []).map((item: any) => ({ ...item, returnDate: fromFirestoreTimestamp(item.returnDate) }))
            } as Order)},
            { name: 'clients', setter: setClients, processor: (d) => ({ ...d.data(), id: d.id } as Client) },
            { name: 'fixedExpenses', setter: setFixedExpenses, processor: (d) => ({ ...d.data(), id: d.id } as FixedExpense) },
            { name: 'monthlyExpenses', setter: setMonthlyExpenses, processor: (d) => ({ ...d.data(), id: d.id } as MonthlyExpense) },
            { name: 'variableExpenses', setter: setVariableExpenses, processor: (d) => ({ ...d.data(), id: d.id, date: fromFirestoreTimestamp(d.data().date) || new Date() } as VariableExpense) },
            { name: 'monthlyIncomes', setter: setMonthlyIncomes, processor: (d) => ({ ...d.data(), id: d.id } as MonthlyIncome) },
        ];

        const loadedCollections = new Set<string>();
        const checkAllLoaded = () => {
            if (loadedCollections.size === collections.length && isMounted) {
                setIsDataLoaded(true);
            }
        };

        collections.forEach(({ name, setter, processor }) => {
            const unsub = onSnapshot(collection(db, name), 
                (snapshot) => {
                    const mappedDocs = snapshot.docs.map(processor);
                    if (isMounted) setter(mappedDocs);
                    loadedCollections.add(name);
                    checkAllLoaded();
                },
                (error) => {
                    console.error(`Error loading ${name}:`, error);
                    loadedCollections.add(name);
                    checkAllLoaded();
                }
            );
            unsubscribers.push(unsub);
        });
    };

    initializeAndListen();
    return () => { isMounted = false; unsubscribers.forEach(u => u()); };
  }, [user, isUserLoading, db]);

  const addOrder = React.useCallback(async (orderData: OrderFormData) => {
    if (!user || !db) return;
    const nextNum = (Math.max(0, ...orders.map(o => parseInt(o.orderNumber) || 0)) + 1).toString();
    const payload = sanitizeForFirestore({ 
        ...orderData, 
        orderNumber: nextNum, 
        totalWithoutVAT: orderData.items.reduce((s, i) => s + i.quantity * (i.priceWithoutVAT || 0), 0), 
        userId: user.uid 
    });
    try { 
        await addDoc(collection(db, 'orders'), payload); 
        toast({ title: "Поръчката е добавена" }); 
    } catch (e) { 
        console.error(e); 
    }
  }, [user, orders, db, toast]);

  const updateOrder = React.useCallback(async (orderUpdate: Partial<Order>) => {
    if (!user || !orderUpdate.id || !db) return;
    const { id, ...data } = orderUpdate;
    let payload = { ...data, userId: user.uid } as any;
    if (orderUpdate.items) payload.totalWithoutVAT = orderUpdate.items.reduce((s, i) => s + i.quantity * (i.priceWithoutVAT || 0), 0);
    try { 
        await setDoc(doc(db, 'orders', id), sanitizeForFirestore(payload), { merge: true }); 
    } catch (e) { 
        console.error(e); 
    }
  }, [user, db]);
  
  const deleteOrder = React.useCallback(async (id: string) => {
    if (!user || !db) return;
    try { await deleteDoc(doc(db, 'orders', id)); toast({ title: 'Поръчката е изтрита', variant: 'destructive'}); } catch (e) { console.error(e); }
  }, [user, db, toast]);

  const addClient = React.useCallback(async (data: Omit<Client, 'id'>): Promise<Client | null> => {
    if (!user || !db) return null;
    try {
        const payload = sanitizeForFirestore({ ...data, name: data.name.trim(), userId: user.uid });
        const docRef = await addDoc(collection(db, 'clients'), payload);
        toast({ title: "Клиентът е добавен" });
        return { ...payload, id: docRef.id } as Client;
    } catch (err) { console.error(err); return null; }
  }, [user, db, toast]);

  const updateClient = React.useCallback(async (data: Client) => {
    if (!user || !data.id || !db) return;
    try { await setDoc(doc(db, 'clients', data.id), sanitizeForFirestore({ ...data, userId: user.uid }), { merge: true }); toast({ title: 'Клиентът е обновен' }); } catch (e) { console.error(e); }
  }, [user, db, toast]);

  const deleteClient = React.useCallback(async (id: string) => {
    if (!user || !db) return;
    try { await deleteDoc(doc(db, 'clients', id)); toast({ title: 'Клиентът е изтрит', variant: 'destructive' }); } catch (e) { console.error(e); }
  }, [user, db, toast]);

  const addFixedExpense = React.useCallback(async (data: FixedExpenseFormData): Promise<FixedExpense | null> => {
    if (!user || !db) return null;
    const payload = sanitizeForFirestore({ ...data, userId: user.uid });
    try {
        const docRef = await addDoc(collection(db, 'fixedExpenses'), payload);
        toast({ title: 'Шаблонът е добавен' });
        return { ...payload, id: docRef.id } as FixedExpense;
    } catch (err) { console.error(err); return null; }
  }, [user, db, toast]);

  const updateFixedExpense = React.useCallback(async (data: Partial<FixedExpense> & { id: string }) => {
    if (!user || !db) return;
    try { await setDoc(doc(db, 'fixedExpenses', data.id), sanitizeForFirestore({ ...data, userId: user.uid }), { merge: true }); toast({ title: 'Шаблонът е обновен' }); } catch (e) { console.error(e); }
  }, [user, db, toast]);
  
  const deleteFixedExpense = React.useCallback(async (id: string) => {
    if (!user || !db) return;
    try { await deleteDoc(doc(db, 'fixedExpenses', id)); toast({ title: 'Шаблонът е изтрит', variant: 'destructive' }); } catch (e) { console.error(e); }
  }, [user, db, toast]);

  const updateMonthlyExpense = React.useCallback(async (expenseId: string, month: Date, amount: number, templateInfo?: Partial<FixedExpense>) => {
    if (!user || !db) return;
    const monthStr = format(month, "yyyy-MM");
    const docId = `${expenseId}_${monthStr}`;
    
    // Вземаме метаданните от съществуващия шаблон, ако не са подадени
    const template = templateInfo || fixedExpenses.find(fe => fe.id === expenseId);
    
    const payload = sanitizeForFirestore({ 
        expenseId, 
        month: monthStr, 
        amount, 
        userId: user.uid,
        name: template?.name,
        paymentMethod: template?.paymentMethod,
        vatType: template?.vatType
    });

    try { 
        await setDoc(doc(db, 'monthlyExpenses', docId), payload); 
    } catch (e) { 
        console.error(e); 
    }
  }, [user, db, fixedExpenses]);

  const deleteMonthlyExpense = React.useCallback(async (expenseId: string, month: Date) => {
    if (!user || !db) return;
    const monthStr = format(month, "yyyy-MM");
    try { await deleteDoc(doc(db, 'monthlyExpenses', `${expenseId}_${monthStr}`)); } catch (e) { console.error(e); }
  }, [user, db]);

  const addVariableExpense = React.useCallback(async (data: VariableExpenseFormData) => {
     if (!user || !db) return;
     try { await addDoc(collection(db, 'variableExpenses'), sanitizeForFirestore({ ...data, userId: user.uid })); toast({ title: 'Разходът е добавен'}); } catch (err) { console.error(err); }
  }, [user, db, toast]);
  
  const updateVariableExpense = React.useCallback(async (data: VariableExpense) => {
    if (!user || !data.id || !db) return;
    try { await setDoc(doc(db, 'variableExpenses', data.id), sanitizeForFirestore({ ...data, userId: user.uid }), { merge: true }); } catch (err) { console.error(err); }
  }, [user, db]);

  const deleteVariableExpense = React.useCallback(async (id: string) => {
    if (!user || !db) return;
    try { await deleteDoc(doc(db, 'variableExpenses', id)); toast({ title: 'Разходът е изтрит', variant: 'destructive'}); } catch (err) { console.error(err); }
  }, [user, db, toast]);

  const updateMonthlyIncome = React.useCallback(async (month: Date, type: 'bank' | 'cash', amount: number) => {
    if (!user || !db) return;
    const monthStr = format(month, "yyyy-MM");
    const docRef = doc(db, 'monthlyIncomes', monthStr);
    try {
        const snap = await getDoc(docRef);
        const data = snap.exists() ? snap.data() : { month: monthStr, bank: 0, cash: 0, userId: user.uid };
        const payload = sanitizeForFirestore({ ...data, [type]: amount, userId: user.uid });
        if (payload.bank === 0 && payload.cash === 0) await deleteDoc(docRef); else await setDoc(docRef, payload);
    } catch (err) { console.error(err); }
  }, [user, db]);

  const addMultipleOrdersAndClients = React.useCallback(async (imported: any[]) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    for (const o of imported) {
        const { id, ...data } = o;
        batch.set(doc(collection(db, 'orders')), sanitizeForFirestore({ ...data, userId: user.uid }));
    }
    await batch.commit();
    toast({ title: "Данните са импортирани" });
  }, [user, db, toast]);

  const addMultipleExpensesAndIncomes = React.useCallback(async (imported: any) => {
    if (!user || !db) return;
    const batch = writeBatch(db);
    for (const i of imported.monthlyIncomes || []) batch.set(doc(db, 'monthlyIncomes', i.month), sanitizeForFirestore({ ...i, userId: user.uid }));
    for (const e of imported.variableExpenses || []) batch.set(doc(collection(db, 'variableExpenses')), sanitizeForFirestore({ ...e, userId: user.uid }));
    for (const e of imported.monthlyExpenses || []) batch.set(doc(db, 'monthlyExpenses', `${e.expenseId}_${e.month}`), sanitizeForFirestore({ ...e, userId: user.uid }));
    await batch.commit();
    toast({ title: 'Данните са импортирани' });
  }, [user, db, toast]);

  return (
    <AppDataContext.Provider value={{ orders, setOrders, clients, isDataLoaded, addOrder, updateOrder, deleteOrder, addClient, updateClient, deleteClient, fixedExpenses, monthlyExpenses, variableExpenses, updateMonthlyExpense, deleteMonthlyExpense, addVariableExpense, updateVariableExpense, deleteVariableExpense, monthlyIncomes, updateMonthlyIncome, addFixedExpense, updateFixedExpense, deleteFixedExpense, addMultipleOrdersAndClients, addMultipleExpensesAndIncomes }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = React.useContext(AppDataContext);
  if (!context) throw new Error('useAppData must be used within an AppDataProvider');
  return context;
}
