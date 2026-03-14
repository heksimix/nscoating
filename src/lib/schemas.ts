import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().min(1, "Името е задължително"),
  eik: z.string().nullable().or(z.literal("")),
  address: z.string().nullable().or(z.literal("")),
  contacts: z.array(z.object({
    name: z.string().min(1, "Името е задължително"),
    phone: z.string().nullable().or(z.literal("")),
  })).default([]),
});

export const orderFormSchema = z.object({
  client: z.string().min(1, "Клиентът е задължителен"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  items: z.array(z.object({
    detailType: z.string().min(1, "Типът детайл е задължителен"),
    quantity: z.number().min(1, "Количеството трябва да е поне 1"),
    priceWithoutVAT: z.number().nullable(),
    returnDate: z.date().nullable().optional(), 
  })),
  paymentMethod: z.string(),
  paymentStatus: z.string(),
  receivedDate: z.date(),
  reason: z.string().nullable().optional(),
  paymentDate: z.date().nullable().optional(),
  returnDate: z.date().nullable().optional(),
});

export const fixedExpenseFormSchema = z.object({
    name: z.string().min(1, "Името е задължително"),
    paymentMethod: z.enum(['bank_transfer', 'card', 'cash']),
    vatType: z.enum(['vat_20', 'vat_0', 'non_taxable']),
    isRecurring: z.boolean(),
    defaultAmount: z.number().min(0).optional().nullable(),
    creationMonth: z.string().optional(),
});

export const variableExpenseSchema = z.object({
    id: z.string().optional(),
    date: z.date(),
    name: z.string().min(1, "Името е задължително"),
    amount: z.number().min(0, "Сумата не може да е отрицателна"),
    hasInvoice: z.boolean(),
});

export const companyDataSchema = z.object({
  name: z.string().min(1, "Името е задължително"),
  address: z.string().min(1, "Адресът е задължителен"),
  eik: z.string().min(1, "ЕИК е задължителен"),
  mol: z.string().min(1, "МОЛ е задължителен"),
  logoUrl: z.string().optional().nullable(),
});

export type ProtocolType = 'receive' | 'return';

export interface Contact {
  name: string;
  phone: string | null;
}

export interface Client {
  id: string;
  name: string;
  address: string | null;
  eik: string | null;
  contacts?: Contact[];
  userId?: string;
}

export interface OrderItem {
  detailType: string;
  quantity: number;
  priceWithoutVAT: number | null;
  returnDate?: Date | string | null; // ПОЗВОЛЯВАМЕ NULL
}

export interface Order {
  id: string;
  orderNumber: string;
  client: string;
  contactPerson?: string;
  phone?: string;
  items: OrderItem[];
  paymentMethod: string;
  paymentStatus: string;
  receivedDate: Date | string;
  paymentDate?: Date | string | null; // ПОЗВОЛЯВАМЕ NULL
  returnDate?: Date | string | null;  // ПОЗВОЛЯВАМЕ NULL
  reason?: string | null;
  totalWithoutVAT: number;
  userId: string;
}

export type OrderFormData = z.infer<typeof orderFormSchema>;

export interface FixedExpense {
  id: string;
  name: string;
  paymentMethod: 'bank_transfer' | 'card' | 'cash';
  vatType: 'vat_20' | 'vat_0' | 'non_taxable';
  isRecurring: boolean;
  creationMonth: string;
  defaultAmount?: number | null;
  userId: string;
}

export type FixedExpenseFormData = z.infer<typeof fixedExpenseFormSchema>;

export interface MonthlyExpense {
  id: string;
  expenseId: string;
  month: string;
  amount: number;
  userId: string;
  name?: string;
  paymentMethod?: 'bank_transfer' | 'card' | 'cash';
  vatType?: 'vat_20' | 'vat_0' | 'non_taxable';
}

export interface VariableExpense {
  id: string;
  date: Date | string;
  name: string;
  amount: number;
  hasInvoice: boolean;
  userId: string;
}

export type VariableExpenseFormData = z.infer<typeof variableExpenseSchema>;

export interface MonthlyIncome {
  month: string;
  bank: number;
  cash: number;
  userId: string;
}

export type CompanyDataFormValues = z.infer<typeof companyDataSchema>;

export interface CompanyData extends CompanyDataFormValues {
  id?: string;
  userId?: string;
}