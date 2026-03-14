"use client";

import * as React from "react";
import { useAppData } from "@/hooks/use-app-data";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, addMonths, subMonths } from "date-fns";
import { bg } from "date-fns/locale";
import { 
  ChevronLeft, ChevronRight, PlusCircle, Trash2, TrendingUp, TrendingDown, 
  Euro, Landmark, Copy, Receipt, ReceiptRussianRuble, Edit, Settings2, 
  Check, ListPlus, CreditCard, LayoutGrid, Filter
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FixedExpense, MonthlyExpense, fixedExpenseFormSchema, VariableExpense, FixedExpenseFormData, VariableExpenseFormData } from "@/lib/schemas";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { VariableExpenseForm } from "./variable-expense-form";
import { SidebarTrigger } from "../ui/sidebar";
import { Switch } from "../ui/switch";
import { ScrollArea } from "../ui/scroll-area";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";

const bankCardExpenseFormSchema = fixedExpenseFormSchema.extend({
  amount: z.coerce.number().min(0, "Сумата не може да бъде отрицателна.").optional(),
});
type BankCardExpenseFormData = z.infer<typeof bankCardExpenseFormSchema>;

const BankCardExpenseForm = ({ onSubmit, onDone, paymentMethod, expense, initialAmount }: { 
    onSubmit: (data: BankCardExpenseFormData) => void;
    onDone: () => void;
    paymentMethod: 'bank_transfer' | 'card';
    expense?: FixedExpense | null;
    initialAmount?: number;
}) => {
    const form = useForm<BankCardExpenseFormData>({
        resolver: zodResolver(bankCardExpenseFormSchema),
        defaultValues: expense ? {
            name: expense.name,
            paymentMethod: (expense.paymentMethod as any) || paymentMethod,
            vatType: expense.vatType as any,
            isRecurring: expense.isRecurring ?? false,
            amount: initialAmount,
            defaultAmount: expense.defaultAmount,
        } : {
            name: "",
            paymentMethod: paymentMethod,
            vatType: 'vat_20',
            amount: undefined,
            isRecurring: false, 
            defaultAmount: undefined,
        },
    });

    const [netAmountStr, setNetAmountStr] = React.useState(initialAmount !== undefined ? initialAmount.toString().replace('.', ',') : '');
    const [grossAmountStr, setGrossAmountStr] = React.useState(() => {
        if (initialAmount === undefined) return '';
        const vatType = expense?.vatType || 'vat_20';
        const gross = vatType === 'vat_20' ? initialAmount * 1.2 : initialAmount;
        return gross.toFixed(2).replace('.', ',');
    });

    const handleAmountChange = (value: string, fieldName: 'net' | 'gross') => {
        const cleanedValue = value.replace(',', '.');
        const currentVatType = form.getValues('vatType');

        if (fieldName === 'net') {
            setNetAmountStr(value);
            const numValue = parseFloat(cleanedValue);
            if (!isNaN(numValue)) {
                form.setValue('amount', numValue, { shouldValidate: true });
                const gross = currentVatType === 'vat_20' ? (numValue * 1.2) : numValue;
                setGrossAmountStr(gross.toFixed(2).replace('.', ','));
            } else {
                form.setValue('amount', undefined, { shouldValidate: true });
                setGrossAmountStr('');
            }
        } else {
            setGrossAmountStr(value);
            const numValue = parseFloat(cleanedValue);
            if (!isNaN(numValue)) {
                const newNetAmount = currentVatType === 'vat_20' ? numValue / 1.2 : numValue;
                setNetAmountStr(newNetAmount.toFixed(2).replace('.', ','));
                form.setValue('amount', newNetAmount, { shouldValidate: true });
            } else {
                setNetAmountStr('');
                form.setValue('amount', undefined, { shouldValidate: true });
            }
        }
    };

    const formatOnBlur = () => {
        const amount = form.getValues('amount');
        if (amount !== undefined && !isNaN(amount)) {
            setNetAmountStr(amount.toFixed(2).replace('.', ','));
            const currentVatType = form.getValues('vatType');
            const gross = currentVatType === 'vat_20' ? (amount * 1.2) : amount;
            setGrossAmountStr(gross.toFixed(2).replace('.', ','));
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => { onSubmit(data); onDone(); })} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Име на разхода</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-normal uppercase">Сума без ДДС</Label>
                        <Input 
                            type="text" 
                            inputMode="decimal" 
                            value={netAmountStr} 
                            onChange={e => handleAmountChange(e.target.value, 'net')}
                            onBlur={formatOnBlur}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-normal uppercase">Сума с ДДС</Label>
                        <Input 
                            type="text" 
                            inputMode="decimal" 
                            value={grossAmountStr} 
                            onChange={e => handleAmountChange(e.target.value, 'gross')}
                            onBlur={formatOnBlur}
                        />
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="vatType"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Тип ДДС</FormLabel>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                onChange={(e) => {
                                    field.onChange(e.target.value);
                                    const amount = form.getValues('amount');
                                    if (amount !== undefined) {
                                        const gross = e.target.value === 'vat_20' ? (amount * 1.2) : amount;
                                        setGrossAmountStr(gross.toFixed(2).replace('.', ','));
                                    }
                                }}
                                value={field.value}
                            >
                                <option value="vat_20">ДДС 20%</option>
                                <option value="vat_0">ДДС 0%</option>
                                <option value="non_taxable">Необлагаем</option>
                            </select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Запази като шаблон</FormLabel>
                                <FormDescription>Ще се появи в списъка с шаблони.</FormDescription>
                            </div>
                            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-2">
                    <Button type="submit">{expense ? "Запази промените" : "Добави разход"}</Button>
                </div>
            </form>
        </Form>
    );
};

const TemplateDialogForm = ({ onSubmit, expense, onDone, defaultPaymentMethod }: { 
    onSubmit: (data: FixedExpenseFormData) => void;
    onDone: () => void;
    expense?: FixedExpense | null;
    defaultPaymentMethod?: 'bank_transfer' | 'card';
}) => {
    const form = useForm<FixedExpenseFormData>({
        resolver: zodResolver(fixedExpenseFormSchema),
        defaultValues: expense ? {
            name: expense.name,
            paymentMethod: expense.paymentMethod as any,
            vatType: expense.vatType as any,
            isRecurring: true,
            defaultAmount: expense.defaultAmount,
        } : {
            name: "",
            paymentMethod: defaultPaymentMethod || 'bank_transfer',
            vatType: 'vat_20',
            isRecurring: true,
            defaultAmount: undefined,
        },
    });

    const [amountStr, setAmountStr] = React.useState(expense?.defaultAmount ? expense.defaultAmount.toString().replace('.', ',') : '');

    const handleAmountChange = (val: string) => {
        setAmountStr(val);
        const num = parseFloat(val.replace(',', '.'));
        form.setValue('defaultAmount', isNaN(num) ? undefined : num);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => { onSubmit({ ...data, isRecurring: true }); onDone(); })} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Име на шаблона</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Метод</FormLabel>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange={field.onChange}
                                    value={field.value}
                                >
                                    <option value="bank_transfer">Банка</option>
                                    <option value="card">Карта</option>
                                </select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="vatType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>ДДС</FormLabel>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    onChange={field.onChange}
                                    value={field.value}
                                >
                                    <option value="vat_20">20%</option>
                                    <option value="vat_0">0%</option>
                                    <option value="non_taxable">Необл.</option>
                                </select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="space-y-2">
                    <Label>Сума по подразбиране (без ДДС)</Label>
                    <div className="relative">
                        <Input 
                            value={amountStr} 
                            onChange={e => handleAmountChange(e.target.value)} 
                            onBlur={() => {
                                const num = parseFloat(amountStr.replace(',', '.'));
                                if (!isNaN(num)) setAmountStr(num.toFixed(2).replace('.', ','));
                            }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">€</span>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit">{expense ? "Запази промените" : "Добави шаблон"}</Button>
                </div>
            </form>
        </Form>
    );
};

export function ExpensesManagement() {
  const { 
    fixedExpenses, 
    monthlyExpenses, 
    variableExpenses, 
    addVariableExpense, 
    deleteVariableExpense, 
    updateVariableExpense,
    isDataLoaded, 
    monthlyIncomes, 
    updateMonthlyIncome, 
    updateMonthlyExpense, 
    deleteMonthlyExpense, 
    addFixedExpense, 
    updateFixedExpense,
    deleteFixedExpense 
  } = useAppData();
  const { toast } = useToast();
  
  const [currentMonth, setCurrentMonth] = React.useState<Date | null>(null);
  const [isAddExpenseOpen, setAddExpenseOpen] = React.useState(false);
  const [addingFixedExpense, setAddingFixedExpense] = React.useState<{ paymentMethod: 'bank_transfer' | 'card' } | null>(null);
  const [editingFixedExpense, setEditingFixedExpense] = React.useState<{ fe: FixedExpense, initialAmount: number } | null>(null);
  const [editingVariableExpense, setEditingVariableExpense] = React.useState<VariableExpense | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = React.useState(false);
  const [editingTemplate, setEditingTemplate] = React.useState<FixedExpense | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = React.useState(false);
  const [deletingFixedExpense, setDeletingFixedExpense] = React.useState<{ id: string, name: string } | null>(null);
  const [libraryFilter, setLibraryFilter] = React.useState<'all' | 'bank_transfer' | 'card'>('all');

  const monthString = currentMonth ? format(currentMonth, 'yyyy-MM') : "";
  
  const currentMonthIncome = React.useMemo(() => 
    monthlyIncomes.find(i => i.month === monthString) || { month: monthString, bank: 0, cash: 0 },
    [monthlyIncomes, monthString]
  );
  
  const [bankIncomeInput, setBankIncomeInput] = React.useState({ net: '', gross: '' });
  const [cashIncomeInput, setCashIncomeInput] = React.useState({ net: '', gross: '' });

  React.useEffect(() => {
    if (!currentMonth) {
        setCurrentMonth(new Date());
    }
  }, [currentMonth]);

  React.useEffect(() => {
    if (!monthString) return;
    
    setBankIncomeInput({ 
        net: currentMonthIncome.bank > 0 ? currentMonthIncome.bank.toString().replace('.', ',') : '', 
        gross: currentMonthIncome.bank > 0 ? (currentMonthIncome.bank * 1.2).toString().replace('.', ',') : '' 
    });
    setCashIncomeInput({ 
        net: currentMonthIncome.cash > 0 ? currentMonthIncome.cash.toString().replace('.', ',') : '', 
        gross: currentMonthIncome.cash > 0 ? (currentMonthIncome.cash * 1.2).toString().replace('.', ',') : '' 
    });
  }, [currentMonthIncome.bank, currentMonthIncome.cash, monthString]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amount);
  };

  const handleIncomeChange = (val: string, method: 'bank' | 'cash', type: 'net' | 'gross') => {
      if (!currentMonth) return;
      const cleanedVal = val.replace(',', '.');
      const num = parseFloat(cleanedVal) || 0;
      
      if (method === 'bank') {
          if (type === 'net') {
              updateMonthlyIncome(currentMonth, 'bank', num);
              setBankIncomeInput(prev => ({ ...prev, net: val, gross: (num * 1.2).toFixed(2).replace('.', ',') }));
          } else {
              const net = num / 1.2;
              updateMonthlyIncome(currentMonth, 'bank', net);
              setBankIncomeInput(prev => ({ ...prev, gross: val, net: net.toFixed(2).replace('.', ',') }));
          }
      } else {
          if (type === 'net') {
              updateMonthlyIncome(currentMonth, 'cash', num);
              setCashIncomeInput(prev => ({ ...prev, net: val, gross: (num * 1.2).toFixed(2).replace('.', ',') }));
          } else {
              const net = num / 1.2;
              updateMonthlyIncome(currentMonth, 'cash', net);
              setCashIncomeInput(prev => ({ ...prev, gross: val, net: net.toFixed(2).replace('.', ',') }));
          }
      }
  };

  const handleAddFixedExpense = async (data: BankCardExpenseFormData) => {
    if (!currentMonth) return;
    const { amount, isRecurring, ...expenseData } = data;
    let expenseId = '';
    let template: FixedExpense | null = null;
    
    if (isRecurring) {
        template = await addFixedExpense({ ...expenseData, defaultAmount: amount, isRecurring: true });
        if (template) expenseId = template.id;
    } else {
        template = await addFixedExpense({ ...expenseData, isRecurring: false, creationMonth: monthString });
        if (template) expenseId = template.id;
    }
    
    if (expenseId && template) {
        updateMonthlyExpense(expenseId, currentMonth, amount || 0, template);
    }
  };

  const handleUpdateFixedMetadata = async (data: BankCardExpenseFormData) => {
      if (editingFixedExpense && currentMonth) {
          const { amount, isRecurring, ...expenseData } = data;
          const templateUpdate = { id: editingFixedExpense.fe.id, ...expenseData, isRecurring };
          updateFixedExpense(templateUpdate);
          updateMonthlyExpense(editingFixedExpense.fe.id, currentMonth, amount || 0, templateUpdate as FixedExpense);
          setEditingFixedExpense(null);
      }
  }

  const handleSelectTemplate = (template: FixedExpense) => {
    if (!currentMonth) return;
    updateMonthlyExpense(template.id, currentMonth, template.defaultAmount || 0, template);
  };

  const handleAddVisibleTemplates = () => {
    const templatesToProcess = fixedExpenses.filter(fe => {
        if (libraryFilter === 'all') return fe.isRecurring !== false;
        const m = String(fe.paymentMethod).trim().toLowerCase();
        const targetMethod = libraryFilter === 'bank_transfer' ? 'bank_transfer' : 'card';
        return m === targetMethod && fe.isRecurring !== false;
    });
    
    templatesToProcess.forEach(fe => {
        const isAlreadyAdded = monthlyExpenses.some(me => me.expenseId === fe.id && me.month === monthString);
        if (!isAlreadyAdded && currentMonth) {
            updateMonthlyExpense(fe.id, currentMonth, fe.defaultAmount || 0, fe);
        }
    });
    toast({ title: "Шаблоните са добавени" });
  };

  const currentMonthMonthlyExpenses = monthlyExpenses.filter(me => me.month === monthString);
  const currentMonthVariableExpenses = variableExpenses.filter(ve => format(new Date(ve.date), 'yyyy-MM') === monthString);

  const getAmountWithVat = (me: MonthlyExpense) => {
      const vatType = me.vatType || fixedExpenses.find(f => f.id === me.expenseId)?.vatType;
      if (vatType === 'vat_20') return me.amount * 1.2;
      return me.amount;
  };

  const bankExpenses = currentMonthMonthlyExpenses.filter(me => {
      const method = me.paymentMethod || fixedExpenses.find(f => f.id === me.expenseId)?.paymentMethod;
      return method === 'bank_transfer';
  });

  const cardExpenses = currentMonthMonthlyExpenses.filter(me => {
      const method = me.paymentMethod || fixedExpenses.find(f => f.id === me.expenseId)?.paymentMethod;
      const m = String(method).trim().toLowerCase();
      return m === 'card';
  });

  const totalMonthlyBankTransfer = bankExpenses.reduce((sum, me) => sum + me.amount, 0);
  const totalMonthlyBankTransferWithVat = bankExpenses.reduce((sum, me) => sum + getAmountWithVat(me), 0);
  
  const totalMonthlyCard = cardExpenses.reduce((sum, me) => sum + me.amount, 0);
  const totalMonthlyCardWithVat = cardExpenses.reduce((sum, me) => sum + getAmountWithVat(me), 0);

  const variableWithInvoice = currentMonthVariableExpenses.filter(e => e.hasInvoice);
  const variableWithoutInvoice = currentMonthVariableExpenses.filter(e => !e.hasInvoice);
  
  const totalVariableWithInvoice = variableWithInvoice.reduce((sum, e) => sum + e.amount, 0);
  const totalVariableWithInvoiceWithVat = variableWithInvoice.reduce((sum, e) => sum + (e.amount * 1.2), 0);
  const totalVariableWithoutInvoice = variableWithoutInvoice.reduce((sum, e) => sum + e.amount, 0);
  
  const totalVariableTax = totalVariableWithoutInvoice * 0.1;
  
  const totalExpenses = totalMonthlyBankTransfer + totalMonthlyCard + totalVariableWithInvoice + totalVariableWithoutInvoice + totalVariableTax;
  const totalExpensesWithVat = totalMonthlyBankTransferWithVat + totalMonthlyCardWithVat + totalVariableWithInvoiceWithVat + totalVariableWithoutInvoice + totalVariableTax;
  
  const totalIncome = currentMonthIncome.bank + currentMonthIncome.cash;
  const totalIncomeWithVat = (currentMonthIncome.bank * 1.2) + (currentMonthIncome.cash * 1.2);
  const totalProfit = totalIncome - totalExpenses;
  const totalProfitWithVat = totalIncomeWithVat - totalExpensesWithVat;
  
  const firmAmount = totalProfit * 0.15;
  const niketsaBase = totalProfit * 0.65;
  const slaviBase = totalProfit * 0.20;

  const cashBalance = (currentMonthIncome.cash * 1.2) - (totalVariableWithInvoiceWithVat + totalVariableWithoutInvoice);
  
  const niketsaNet = niketsaBase * 0.9;
  const niketsaBankDiff = niketsaNet - cashBalance;

  const renderVatInfo = (me: MonthlyExpense) => {
      const vatType = me.vatType || fixedExpenses.find(f => f.id === me.expenseId)?.vatType;
      if (!vatType) return null;
      if (vatType === 'vat_20') {
          return `с ДДС: ${formatCurrency(me.amount * 1.2)}`;
      }
      switch (vatType) {
          case 'vat_0': return 'ДДС 0%';
          case 'non_taxable': return 'Необлагаем';
          default: return '';
      }
  };

  const forceUIUnlock = () => {
    setTimeout(() => {
      document.body.removeAttribute('style');
      document.body.style.pointerEvents = 'auto';
    }, 300);
  };

  const confirmDeleteTemplate = () => {
    if (deletingFixedExpense) {
        deleteFixedExpense(deletingFixedExpense.id);
        setDeletingFixedExpense(null);
        forceUIUnlock();
    }
  };

  if (!isDataLoaded || !currentMonth) return <div className="p-8 text-center">Зареждане...</div>;

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full items-center justify-between lg:w-auto">
                <CardTitle>Приходи, Разходи</CardTitle>
                <SidebarTrigger className="lg:hidden"/>
            </div>
            <div className="flex items-center gap-2 text-lg font-semibold capitalize">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth!, 1))}><ChevronLeft className="h-4 w-4" /></Button>
                <span>{format(currentMonth, "LLLL yyyy", { locale: bg })}</span>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth!, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className={cn(totalProfit >= 0 ? "bg-status-paid/5 border-status-paid/20" : "bg-status-unpaid/5 border-status-unpaid/20")}>
              <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base font-medium">Печалба за месеца</CardTitle>
                  {totalProfit > 0 ? <TrendingUp className="h-6 w-6 text-status-paid" /> : <TrendingDown className="h-6 w-6 text-status-unpaid" />}
              </CardHeader>
              <CardContent className="space-y-4">
                  <div>
                    <p className={cn("text-4xl font-bold", totalProfit > 0 ? "text-status-paid" : "text-status-unpaid")}>
                        {formatCurrency(totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalProfitWithVat)}</p>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground font-medium">Фирма (15%):</span>
                          <span className="font-semibold">{formatCurrency(firmAmount)}</span>
                      </div>
                      <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                              <span className="text-muted-foreground font-medium">Никеца (65%):</span>
                              <span className={cn(
                                "text-xs font-bold",
                                niketsaBankDiff >= 0 ? "text-status-paid" : "text-status-unpaid"
                              )}>
                                {niketsaBankDiff >= 0 
                                    ? `(за теглене от банка: ${formatCurrency(niketsaBankDiff)})` 
                                    : `(за внасяне в банка: ${formatCurrency(Math.abs(niketsaBankDiff))})`}
                              </span>
                          </div>
                          <span className="font-semibold">{formatCurrency(niketsaNet)}</span>
                      </div>
                      <div className="flex justify-between items-start">
                          <span className="text-muted-foreground font-medium">Слави (20%):</span>
                          <span className="font-semibold">{formatCurrency(slaviBase * 0.9)}</span>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Приходи за месеца</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold">{formatCurrency(totalIncome)}</p>
                  <p className="text-xs text-muted-foreground font-normal mb-4">с ДДС: {formatCurrency(totalIncomeWithVat)}</p>
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2 text-xs font-normal text-muted-foreground flex items-center gap-1"><Landmark className="h-3 w-3"/> По Банка</div>
                          <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-normal uppercase">Сума без ДДС</Label>
                              <Input 
                                type="text" 
                                inputMode="decimal" 
                                value={bankIncomeInput.net} 
                                onChange={e => setBankIncomeInput({...bankIncomeInput, net: e.target.value})} 
                                onBlur={e => {
                                    handleIncomeChange(e.target.value, 'bank', 'net');
                                    const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                                    setBankIncomeInput(prev => ({ ...prev, net: val.toFixed(2).replace('.', ',') }));
                                }} 
                                className="h-8" 
                              />
                          </div>
                          <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-normal uppercase">Сума с ДДС</Label>
                              <Input 
                                type="text" 
                                inputMode="decimal" 
                                value={bankIncomeInput.gross} 
                                onChange={e => setBankIncomeInput({...bankIncomeInput, gross: e.target.value})} 
                                onBlur={e => {
                                    handleIncomeChange(e.target.value, 'bank', 'gross');
                                    const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                                    setBankIncomeInput(prev => ({ ...prev, gross: val.toFixed(2).replace('.', ',') }));
                                }} 
                                className="h-8" 
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                          <div className="col-span-2 text-xs font-normal text-muted-foreground flex items-center gap-1"><Euro className="h-3 w-3"/> В брой (Каса)</div>
                          <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-normal uppercase">Сума без ДДС</Label>
                              <Input 
                                type="text" 
                                inputMode="decimal" 
                                value={cashIncomeInput.net} 
                                onChange={e => setCashIncomeInput({...cashIncomeInput, net: e.target.value})} 
                                onBlur={e => {
                                    handleIncomeChange(e.target.value, 'cash', 'net');
                                    const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                                    setCashIncomeInput(prev => ({ ...prev, net: val.toFixed(2).replace('.', ',') }));
                                }} 
                                className="h-8" 
                              />
                          </div>
                          <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground font-normal uppercase">Сума с ДДС</Label>
                              <Input 
                                type="text" 
                                inputMode="decimal" 
                                value={cashIncomeInput.gross} 
                                onChange={e => setCashIncomeInput({...cashIncomeInput, gross: e.target.value})} 
                                onBlur={e => {
                                    handleIncomeChange(e.target.value, 'cash', 'gross');
                                    const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                                    setCashIncomeInput(prev => ({ ...prev, gross: val.toFixed(2).replace('.', ',') }));
                                }} 
                                className="h-8" 
                              />
                          </div>
                      </div>
                  </div>
              </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
              <CardHeader className="pb-2"><CardTitle className="text-base font-medium">Общо разходи</CardTitle></CardHeader>
              <CardContent>
                  <p className="text-3xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
                  <p className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalExpensesWithVat)}</p>
                  <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between items-start">
                          <span className="text-muted-foreground font-medium">Банка:</span>
                          <div className="text-right">
                              <span className="font-medium">{formatCurrency(totalMonthlyBankTransfer)}</span>
                              <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalMonthlyBankTransferWithVat)}</div>
                          </div>
                      </div>
                      <div className="flex justify-between items-start">
                          <span className="text-muted-foreground font-medium">Карта:</span>
                          <div className="text-right">
                              <span className="font-medium">{formatCurrency(totalMonthlyCard)}</span>
                              <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalMonthlyCardWithVat)}</div>
                          </div>
                      </div>
                      <div className="flex justify-between items-start">
                          <span className="text-muted-foreground font-medium">Каса:</span>
                          <div className="text-right">
                              <span className="font-medium">{formatCurrency(totalVariableWithInvoice + totalVariableWithoutInvoice)}</span>
                              <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalVariableWithInvoiceWithVat + totalVariableWithoutInvoice)}</div>
                          </div>
                      </div>
                      <div className="pl-4 space-y-1 border-l-2 border-muted">
                          <div className="flex justify-between items-start">
                              <span className="text-muted-foreground text-xs">с фактура:</span>
                              <div className="text-right">
                                  <span className="text-xs font-medium">{formatCurrency(totalVariableWithInvoice)}</span>
                                  <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalVariableWithInvoiceWithVat)}</div>
                              </div>
                          </div>
                          <div className="flex justify-between items-start">
                              <span className="text-muted-foreground text-xs">без фактура:</span>
                              <div className="text-right">
                                  <span className="text-xs font-medium">{formatCurrency(totalVariableWithoutInvoice)}</span>
                                  <div className="text-xs text-muted-foreground font-normal">Не се възстановява ДДС</div>
                              </div>
                          </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-destructive/10">
                          <span className="text-muted-foreground font-medium">Данък (10%):</span>
                          <span className="font-medium text-[#e88f12]">{formatCurrency(totalVariableTax)}</span>
                      </div>
                  </div>
              </CardContent>
          </Card>
      </div>

      <div className="flex justify-end gap-2 px-1">
          <Button variant="outline" onClick={() => setIsLibraryOpen(true)}><Copy className="h-4 w-4 mr-2" />Шаблони на разходи</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-6">
              <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex flex-col gap-1">
                          <CardTitle>Плащания Банка</CardTitle>
                          <div className="text-right sm:text-left space-y-0.5">
                              <div className="text-sm font-semibold text-primary">Общо: {formatCurrency(totalMonthlyBankTransfer)}</div>
                              <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalMonthlyBankTransferWithVat)}</div>
                          </div>
                      </div>
                      <Button size="sm" onClick={() => setAddingFixedExpense({ paymentMethod: 'bank_transfer' })}><PlusCircle className="h-4 w-4 mr-1" />Добави</Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      {bankExpenses.map(me => {
                          const template = fixedExpenses.find(f => f.id === me.expenseId);
                          return (
                              <div key={me.id} className="flex items-center justify-between p-3 rounded-md border border-muted bg-muted/10 group hover:border-primary/30 transition-colors">
                                  <div>
                                      <p className="font-medium text-base">{me.name || template?.name || "Нов превод"}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="text-right">
                                          <span className="font-bold text-base">{formatCurrency(me.amount)}</span>
                                          <p className="text-xs text-muted-foreground font-normal">
                                              {renderVatInfo(me)}
                                          </p>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingFixedExpense({ fe: (template || { id: me.expenseId, name: me.name, paymentMethod: me.paymentMethod, vatType: me.vatType } as FixedExpense), initialAmount: me.amount })}><Edit className="h-3.5 w-3.5" /></Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteMonthlyExpense(me.expenseId, currentMonth!)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                      {bankExpenses.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm italic">Няма добавени плащания.</p>}
                  </CardContent>
              </Card>

              <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex flex-col gap-1">
                          <CardTitle>Плащания Карта</CardTitle>
                          <div className="text-right sm:text-left space-y-0.5">
                              <div className="text-sm font-semibold text-primary">Общо: {formatCurrency(totalMonthlyCard)}</div>
                              <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalMonthlyCardWithVat)}</div>
                          </div>
                      </div>
                      <Button size="sm" onClick={() => setAddingFixedExpense({ paymentMethod: 'card' })}><PlusCircle className="h-4 w-4 mr-1" />Добави</Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                      {cardExpenses.map(me => {
                          const template = fixedExpenses.find(f => f.id === me.expenseId);
                          return (
                              <div key={me.id} className="flex items-center justify-between p-3 rounded-md border border-muted bg-muted/10 group hover:border-primary/30 transition-colors">
                                  <div>
                                      <p className="font-medium text-base">{me.name || template?.name || "Ново плащане"}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="text-right">
                                          <span className="font-bold text-base">{formatCurrency(me.amount)}</span>
                                          <p className="text-xs text-muted-foreground font-normal">
                                              {renderVatInfo(me)}
                                          </p>
                                      </div>
                                      <div className="flex flex-col gap-1">
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingFixedExpense({ fe: (template || { id: me.expenseId, name: me.name, paymentMethod: me.paymentMethod, vatType: me.vatType } as FixedExpense), initialAmount: me.amount })}><Edit className="h-3.5 w-3.5" /></Button>
                                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => deleteMonthlyExpense(me.expenseId, currentMonth!)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                      </div>
                                  </div>
                              </div>
                          );
                      })}
                      {cardExpenses.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm italic">Няма добавени плащания.</p>}
                  </CardContent>
              </Card>
          </div>

          <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex flex-col gap-1">
                      <CardTitle>Разходи Каса (В брой)</CardTitle>
                      <div className="text-right sm:text-left space-y-0.5">
                          <div className="text-sm font-semibold text-primary">Общо: {formatCurrency(totalVariableWithInvoice + totalVariableWithoutInvoice)}</div>
                          <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalVariableWithInvoiceWithVat + totalVariableWithoutInvoice)}</div>
                      </div>
                  </div>
                  <Button size="sm" onClick={() => setAddExpenseOpen(true)}><PlusCircle className="h-4 w-4 mr-1" />Добави</Button>
              </CardHeader>
              <CardContent className="space-y-8">
                  <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex flex-col">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider"><Receipt className="h-4 w-4" /> С фактура</h4>
                        </div>
                        <div className="text-right space-y-0.5">
                            <div className="text-sm font-semibold text-primary">Общо: {formatCurrency(totalVariableWithInvoice)}</div>
                            <div className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(totalVariableWithInvoiceWithVat)}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {variableWithInvoice.map(ve => (
                            <div key={ve.id} className="flex items-center justify-between p-3 rounded-md border border-muted bg-muted/10 group hover:border-primary/30 transition-colors">
                                <div><p className="font-medium text-base">{ve.name}</p><p className="text-xs text-muted-foreground font-normal">{format(new Date(ve.date), 'dd.MM.yyyy')}</p></div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="font-bold text-base">{formatCurrency(ve.amount)}</span>
                                        <p className="text-xs text-muted-foreground font-normal">с ДДС: {formatCurrency(ve.amount * 1.2)}</p>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingVariableExpense(ve)}><Edit className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteVariableExpense(ve.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                      </div>
                  </div>
                  <div>
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex flex-col">
                            <h4 className="text-sm font-bold flex items-center gap-2 text-primary uppercase tracking-wider"><ReceiptRussianRuble className="h-4 w-4" /> Без фактура</h4>
                        </div>
                        <div className="text-right space-y-0.5">
                            <div className="text-sm font-semibold text-primary">Общо: {formatCurrency(totalVariableWithoutInvoice)}</div>
                            <div className="text-xs font-normal text-[#e88f12]">Дължим данък (10%): {formatCurrency(totalVariableTax)}</div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {variableWithoutInvoice.map(ve => (
                            <div key={ve.id} className="flex items-center justify-between p-3 rounded-md border border-muted bg-muted/10 group hover:border-primary/30 transition-colors">
                                <div>
                                    <p className="font-medium text-base">{ve.name}</p>
                                    <p className="text-xs text-muted-foreground font-normal">{format(new Date(ve.date), 'dd.MM.yyyy')}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="font-bold text-base">{formatCurrency(ve.amount)}</span>
                                        <div className="mt-1">
                                            <p className="text-xs font-normal text-[#e88f12]">данък 10%: {formatCurrency(ve.amount * 0.1)}</p>
                                            <p className="text-xs text-muted-foreground font-normal">Не се възстановява ДДС</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => setEditingVariableExpense(ve)}><Edit className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteVariableExpense(ve.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                      </div>
                  </div>
              </CardContent>
              <CardFooter className="border-t pt-4 flex flex-col items-end gap-4">
                  <div className="w-full text-right">
                      <p className="text-xs text-muted-foreground font-normal uppercase tracking-tighter">Наличност след разходи платени в брой</p>
                      <p className="text-2xl font-black text-primary">Баланс Каса: {formatCurrency(cashBalance)}</p>
                  </div>
              </CardFooter>
          </Card>
      </div>

      <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
          <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-4 pr-16 flex-shrink-0">
                  <div className="flex items-center justify-between">
                      <DialogTitle className="text-xl font-bold">Шаблони за разходи</DialogTitle>
                      <Button size="sm" onClick={() => setIsAddingTemplate(true)} className="gap-1 shadow-sm">
                          <PlusCircle className="h-4 w-4" /> Добави шаблон
                      </Button>
                  </div>
                  <DialogDescription>Управлявайте повтарящите се разходи и ги добавяйте бързо към месеца.</DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                  <div className="px-6 py-3 bg-muted/20 border-b flex flex-col gap-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <Filter className="h-3 w-3" /> Филтър по метод:
                      </div>
                      <div className="flex gap-2">
                          <Button 
                              variant={libraryFilter === 'all' ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => setLibraryFilter('all')}
                              className="h-8 gap-2 font-bold"
                          >
                              <LayoutGrid className="h-4 w-4" /> Всички
                          </Button>
                          <Button 
                              variant={libraryFilter === 'bank_transfer' ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => setLibraryFilter('bank_transfer')}
                              className="h-8 gap-2 font-bold"
                          >
                              <Landmark className="h-4 w-4" /> Банка
                          </Button>
                          <Button 
                              variant={libraryFilter === 'card' ? "default" : "outline"} 
                              size="sm" 
                              onClick={() => setLibraryFilter('card')}
                              className="h-8 gap-2 font-bold"
                          >
                              <CreditCard className="h-4 w-4" /> Карта
                          </Button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
                      <div className="flex items-center justify-between px-6 py-3 border-b bg-muted/5 flex-shrink-0">
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            Налични шаблони
                          </span>
                          <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[10px] gap-1 px-2 font-bold uppercase tracking-tighter hover:bg-primary hover:text-primary-foreground transition-colors"
                              onClick={handleAddVisibleTemplates}
                          >
                              <ListPlus className="h-3 w-3" /> Добави видимите
                          </Button>
                      </div>
                      <ScrollArea className="flex-1">
                          <div className="p-6 space-y-3">
                              {fixedExpenses.filter(fe => {
                                  if (fe.isRecurring === false) return false;
                                  if (libraryFilter === 'all') return true;
                                  return fe.paymentMethod === libraryFilter;
                              }).length > 0 ? (
                                  fixedExpenses.filter(fe => {
                                      if (fe.isRecurring === false) return false;
                                      if (libraryFilter === 'all') return true;
                                      return fe.paymentMethod === libraryFilter;
                                  }).map(fe => {
                                      const isAlreadyAdded = monthlyExpenses.some(me => me.expenseId === fe.id && me.month === monthString);
                                      return (
                                          <div key={fe.id} className="group relative flex items-center justify-between p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all hover:border-primary/20">
                                              <div className="flex flex-col gap-1">
                                                  <div className="flex items-center gap-2">
                                                      {fe.paymentMethod === 'bank_transfer' ? <Landmark className="h-3.5 w-3.5 text-muted-foreground" /> : <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />}
                                                      <h4 className="font-bold text-base leading-tight">{fe.name}</h4>
                                                  </div>
                                                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                                                      <span className={cn(
                                                          "px-1.5 py-0.5 rounded bg-muted font-bold",
                                                          fe.vatType === 'vat_20' ? "text-primary bg-primary/10" : "text-muted-foreground"
                                                      )}>
                                                          {fe.vatType === 'vat_20' ? '20% ДДС' : fe.vatType === 'vat_0' ? '0% ДДС' : 'Необл.'}
                                                      </span>
                                                      {fe.defaultAmount ? (
                                                          <span className="flex items-center gap-1 font-bold text-foreground">
                                                              <Euro className="h-3 w-3" /> {fe.defaultAmount.toFixed(2)}
                                                          </span>
                                                      ) : <span className="italic opacity-60">Без сума</span>}
                                                  </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                  <Button 
                                                      variant="ghost" 
                                                      size="icon" 
                                                      className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5"
                                                      onClick={() => setEditingTemplate(fe)}
                                                  >
                                                      <Settings2 className="h-4 w-4" />
                                                  </Button>
                                                  <Button 
                                                      variant="ghost" 
                                                      size="icon" 
                                                      className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                                      onClick={() => setDeletingFixedExpense({ id: fe.id, name: fe.name })}
                                                  >
                                                      <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                  <Separator orientation="vertical" className="h-6 mx-1" />
                                                  {isAlreadyAdded ? (
                                                      <div className="flex items-center gap-1.5 text-xs font-bold text-status-paid bg-status-paid/10 px-3 py-1.5 rounded-full border border-status-paid/20">
                                                          <Check className="h-3.5 w-3.5" /> Добавен
                                                      </div>
                                                  ) : (
                                                      <Button size="sm" className="gap-1.5 rounded-full font-bold shadow-sm" onClick={() => handleSelectTemplate(fe)}>
                                                          <PlusCircle className="h-3.5 w-3.5" /> Избери
                                                      </Button>
                                                  )}
                                              </div>
                                          </div>
                                      );
                                  })
                              ) : (
                                  <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-muted bg-muted/5">
                                      <Copy className="h-10 w-10 mx-auto text-muted-foreground opacity-20 mb-3" />
                                      <p className="text-sm font-medium text-muted-foreground">Няма шаблони за избрания метод.</p>
                                      <Button variant="link" size="sm" onClick={() => setIsAddingTemplate(true)} className="mt-1">Създайте първия си шаблон</Button>
                                  </div>
                              )}
                          </div>
                      </ScrollArea>
                  </div>
              </div>
              <Separator />
              <div className="p-4 bg-muted/5 flex-shrink-0 flex justify-end">
                  <Button variant="ghost" onClick={() => setIsLibraryOpen(false)} className="font-semibold">Затвори</Button>
              </div>
          </DialogContent>
      </Dialog>

      {isAddingTemplate && (
          <Dialog open={isAddingTemplate} onOpenChange={setIsAddingTemplate}>
              <DialogContent>
                  <DialogHeader><DialogTitle>Създаване на шаблон</DialogTitle><DialogDescription>Дефинирайте нов повтарящ се разход с данни по подразбиране.</DialogDescription></DialogHeader>
                  <TemplateDialogForm 
                    defaultPaymentMethod={libraryFilter === 'all' ? 'bank_transfer' : libraryFilter} 
                    onSubmit={addFixedExpense} 
                    onDone={() => setIsAddingTemplate(false)} 
                  />
              </DialogContent>
          </Dialog>
      )}

      {editingTemplate && (
          <Dialog open={!!editingTemplate} onOpenChange={o => !o && setEditingTemplate(null)}>
              <DialogContent>
                  <DialogHeader><DialogTitle>Редактиране на шаблон</DialogTitle><DialogDescription>Променете настройките на избрания шаблон.</DialogDescription></DialogHeader>
                  <TemplateDialogForm expense={editingTemplate} onSubmit={(data) => updateFixedExpense({ id: editingTemplate.id, ...data })} onDone={() => setEditingTemplate(null)} />
              </DialogContent>
          </Dialog>
      )}

      {addingFixedExpense && (
          <Dialog open={!!addingFixedExpense} onOpenChange={o => !o && setAddingFixedExpense(null)}>
              <DialogContent><DialogHeader><DialogTitle>Добави нов разход</DialogTitle></DialogHeader><BankCardExpenseForm paymentMethod={addingFixedExpense.paymentMethod} onSubmit={handleAddFixedExpense} onDone={() => setAddingFixedExpense(null)} /></DialogContent>
          </Dialog>
      )}

      {editingFixedExpense && (
          <Dialog open={!!editingFixedExpense} onOpenChange={o => !o && setEditingFixedExpense(null)}>
              <DialogContent>
                  <DialogHeader><DialogTitle>Редактиране на разход</DialogTitle></DialogHeader>
                  <BankCardExpenseForm paymentMethod={editingFixedExpense.fe.paymentMethod as any} expense={editingFixedExpense.fe} initialAmount={editingFixedExpense.initialAmount} onSubmit={handleUpdateFixedMetadata} onDone={() => setEditingFixedExpense(null)} />
              </DialogContent>
          </Dialog>
      )}

      {editingVariableExpense && (
          <Dialog open={!!editingVariableExpense} onOpenChange={o => !o && setEditingVariableExpense(null)}>
              <DialogContent>
                  <DialogHeader><DialogTitle>Редактиране на касов разход</DialogTitle></DialogHeader>
                  <VariableExpenseForm expense={editingVariableExpense} onSubmit={(data) => updateVariableExpense(data as VariableExpense)} onDone={() => setEditingVariableExpense(null)} />
              </DialogContent>
          </Dialog>
      )}

      {isAddExpenseOpen && (
          <Dialog open={isAddExpenseOpen} onOpenChange={setAddExpenseOpen}>
              <DialogContent>
                  <DialogHeader><DialogTitle>Добави касов разход</DialogTitle></DialogHeader>
                  <VariableExpenseForm onSubmit={(data) => addVariableExpense(data as VariableExpenseFormData)} onDone={() => setAddExpenseOpen(false)} />
              </DialogContent>
          </Dialog>
      )}

      <AlertDialog open={!!deletingFixedExpense} onOpenChange={(open) => { 
          if (!open) {
              setDeletingFixedExpense(null);
              forceUIUnlock();
          }
      }}>
          <AlertDialogContent
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              forceUIUnlock();
            }}
          >
              <AlertDialogHeader>
                  <AlertDialogTitle>Изтриване на шаблон</AlertDialogTitle>
                  <AlertDialogDescription>Сигурни ли сте, че искате да изтриете шаблона &quot;{deletingFixedExpense?.name}&quot;?</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel onClick={forceUIUnlock}>Отказ</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmDeleteTemplate}>Изтрий</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}