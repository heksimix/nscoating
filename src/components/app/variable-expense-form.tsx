"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { bg } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import type { VariableExpenseFormData, VariableExpense } from "@/lib/schemas";
import { variableExpenseSchema } from "@/lib/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


// Form for adding/editing variable expenses
export function VariableExpenseForm({ onSubmit, expense, onDone }: { onSubmit: (data: VariableExpenseFormData | VariableExpense) => void; expense?: VariableExpense | null, onDone: () => void; }) {
    const isEditMode = !!expense;
    const form = useForm<VariableExpenseFormData>({
        resolver: zodResolver(variableExpenseSchema.omit({id: true})),
        defaultValues: isEditMode && expense ? { ...expense, date: new Date(expense.date), hasInvoice: expense.hasInvoice || false, amount: expense.amount || 0 } : {
            date: new Date(),
            name: "",
            amount: 0,
            hasInvoice: false,
        },
    });

    const hasInvoice = form.watch("hasInvoice");
    
    const [netAmountStr, setNetAmountStr] = React.useState<string>(() => {
        if (isEditMode && expense?.hasInvoice) {
            return expense.amount?.toString().replace('.', ',') ?? '';
        }
        return '';
    });
    const [grossAmountStr, setGrossAmountStr] = React.useState<string>(() => {
        if (isEditMode && expense) {
            const amount = expense.hasInvoice 
                ? (expense.amount * 1.2) 
                : expense.amount;
            return amount?.toFixed(2).replace('.', ',') ?? '';
        }
        return '';
    });
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

    
    const handleAmountChange = React.useCallback((value: string, fieldName: 'net' | 'gross') => {
        const cleanedValue = value.replace(',', '.');

        if (hasInvoice) {
            if (fieldName === 'net') {
                setNetAmountStr(value);
                const numValue = parseFloat(cleanedValue);
                if (!isNaN(numValue)) {
                    form.setValue('amount', numValue, { shouldValidate: true });
                    const gross = numValue * 1.2;
                    setGrossAmountStr(gross.toFixed(2).replace('.', ','));
                } else {
                     form.setValue('amount', 0, { shouldValidate: true });
                     setGrossAmountStr('');
                }
            } else { // gross
                setGrossAmountStr(value);
                const numValue = parseFloat(cleanedValue);
                if (!isNaN(numValue)) {
                    const netAmount = numValue / 1.2;
                    setNetAmountStr(netAmount.toFixed(2).replace('.', ','));
                    form.setValue('amount', netAmount, { shouldValidate: true });
                } else {
                    setNetAmountStr('');
                    form.setValue('amount', 0, { shouldValidate: true });
                }
            }
        } else { // No invoice
            setGrossAmountStr(value);
            const numValue = parseFloat(cleanedValue);
            if (!isNaN(numValue)) {
                form.setValue('amount', numValue, { shouldValidate: true });
            } else {
                form.setValue('amount', 0, { shouldValidate: true });
            }
        }
    }, [form, hasInvoice]);

    const formatOnBlur = () => {
        const amount = form.getValues('amount');
        if (amount !== undefined && !isNaN(amount)) {
            if (hasInvoice) {
                setNetAmountStr(amount.toFixed(2).replace('.', ','));
                setGrossAmountStr((amount * 1.2).toFixed(2).replace('.', ','));
            } else {
                setNetAmountStr('');
                setGrossAmountStr(amount.toFixed(2).replace('.', ','));
            }
        }
    };
    
    const isInitialRender = React.useRef(true);
    React.useEffect(() => {
        if (isInitialRender.current) {
            isInitialRender.current = false;
            return;
        }

        const cleanedGross = grossAmountStr.replace(',', '.');
        const grossValue = parseFloat(cleanedGross);
        if(!isNaN(grossValue)) {
            if(hasInvoice) { 
                const netValue = grossValue / 1.2;
                setNetAmountStr(netValue.toFixed(2).replace('.', ','));
                setGrossAmountStr(grossValue.toFixed(2).replace('.', ','));
                form.setValue('amount', netValue);
            } else { 
                setNetAmountStr('');
                setGrossAmountStr(grossValue.toFixed(2).replace('.', ','));
                form.setValue('amount', grossValue);
            }
        } else {
            setNetAmountStr('');
            setGrossAmountStr('');
            form.setValue('amount', 0, { shouldValidate: true });
        }

    }, [hasInvoice, form, grossAmountStr]);
    
    const handleSubmit = (data: VariableExpenseFormData) => {
        if (isEditMode && expense) {
            onSubmit({ id: expense.id, ...data } as VariableExpense);
        } else {
            onSubmit(data);
        }
        onDone();
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                
                <FormField
                    control={form.control}
                    name="hasInvoice"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                            <div className="space-y-0.5">
                                <FormLabel>Плащане с фактура</FormLabel>
                                <FormDescription>
                                    Включете, ако за този разход има издадена фактура.
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="space-y-4">
                    {hasInvoice ? (
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground font-normal uppercase">Сума без ДДС</Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={netAmountStr}
                                    onChange={(e) => handleAmountChange(e.target.value, 'net')}
                                    onBlur={formatOnBlur}
                                    />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground font-normal uppercase">Сума с ДДС</Label>
                                <Input
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="0.00"
                                    value={grossAmountStr}
                                    onChange={(e) => handleAmountChange(e.target.value, 'gross')}
                                    onBlur={formatOnBlur}
                                    />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground font-normal uppercase">Сума с ДДС</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={grossAmountStr}
                                onChange={(e) => handleAmountChange(e.target.value, 'gross')}
                                onBlur={formatOnBlur}
                                />
                        </div>
                    )}
                </div>

                 <FormField
                    control={form.control}
                    name="amount"
                    render={() => (
                        <FormItem className="hidden">
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {!hasInvoice && (
                    <p className="text-xs text-muted-foreground">
                        За суми без фактура се дължи данък от 10%
                    </p>
                )}

                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Дата</FormLabel>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen} modal={true}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className="pl-3 text-left font-normal">
                                            {field.value ? format(field.value, "PPP", { locale: bg }) : <span>Изберете дата</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        locale={bg}
                                        mode="single"
                                        selected={field.value}
                                        onSelect={(date) => {
                                            if (date) field.onChange(date);
                                            setIsCalendarOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Запазване..." : (isEditMode ? 'Запази промените' : 'Добави разход')}
                  </Button>
                </div>
            </form>
        </Form>
    );
}
