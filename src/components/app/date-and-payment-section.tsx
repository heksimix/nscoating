"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { format, isValid } from "date-fns";
import { bg } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { OrderFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const paymentStatuses: readonly [string, ...string[]] = ["Платено", "Неплатено", "Няма"];
const paymentMethods: readonly [string, ...string[]] = ["В брой", "Банков превод", "Няма"];

interface DateAndPaymentSectionProps {
    form: UseFormReturn<OrderFormData>;
}

export function DateAndPaymentSection({ form }: DateAndPaymentSectionProps) {
    const watchedPaymentMethod = form.watch("paymentMethod");
    const watchedPaymentStatus = form.watch("paymentStatus");
    const watchedReceivedDate = form.watch("receivedDate");

    const [isReceivedOpen, setIsReceivedOpen] = React.useState(false);
    const [isReturnOpen, setIsReturnOpen] = React.useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);

    // Effect to synchronize payment status when method is 'Няма'
    React.useEffect(() => {
        if (watchedPaymentMethod === 'Няма') {
            form.setValue('paymentStatus', 'Няма');
        } else {
            if (form.getValues('paymentStatus') === 'Няма') {
                form.setValue('paymentStatus', 'Неплатено');
            }
        }
    }, [watchedPaymentMethod, form]);
    
    // Effect to synchronize payment method and date
    React.useEffect(() => {
        if (watchedPaymentStatus === 'Няма') {
            form.setValue('paymentMethod', 'Няма');
            form.setValue('paymentDate', undefined);
        } else if (watchedPaymentStatus === 'Платено') {
            if (!form.getValues('paymentDate')) {
                form.setValue('paymentDate', new Date());
            }
        } else { // 'Неплатено'
             form.setValue('paymentDate', undefined);
        }
    }, [watchedPaymentStatus, form]);

    const showReasonField = watchedPaymentMethod === 'Няма' || watchedPaymentStatus === 'Няма';

    const parseDate = (val: any): Date | undefined => {
        if (!val) return undefined;
        const d = new Date(val);
        return isValid(d) ? d : undefined;
    };

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <FormField
                    control={form.control}
                    name="receivedDate"
                    render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                            <FormLabel>Дата на получаване</FormLabel>
                            <Popover open={isReceivedOpen} onOpenChange={setIsReceivedOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(new Date(field.value), "PPP", { locale: bg }) : <span>Изберете дата</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start" onPointerDownOutside={(e) => e.preventDefault()}>
                                    <Calendar
                                        locale={bg}
                                        mode="single"
                                        selected={parseDate(field.value)}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setIsReceivedOpen(false);
                                            const returnDate = form.getValues("returnDate");
                                            if (date && returnDate && new Date(returnDate) < date) {
                                                form.setValue("returnDate", undefined);
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="returnDate"
                    render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                            <FormLabel>Дата на връщане</FormLabel>
                            <Popover open={isReturnOpen} onOpenChange={setIsReturnOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(new Date(field.value), "PPP", { locale: bg }) : <span>Изберете дата</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start" onPointerDownOutside={(e) => e.preventDefault()}>
                                    <Calendar
                                        locale={bg}
                                        mode="single"
                                        selected={parseDate(field.value)}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setIsReturnOpen(false);
                                        }}
                                        disabled={watchedReceivedDate ? { before: new Date(watchedReceivedDate) } : undefined}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                            <FormLabel>Начин на плащане</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {paymentMethods.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                            <FormLabel>Статус на плащане</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {paymentStatuses.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="paymentDate"
                    render={({ field }) => (
                        <FormItem className="lg:col-span-1">
                            <FormLabel>Дата на плащане</FormLabel>
                            <Popover open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button 
                                            variant={"outline"} 
                                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                                            disabled={watchedPaymentStatus !== 'Платено'}
                                        >
                                            {field.value ? format(new Date(field.value), "PPP", { locale: bg }) : <span>-</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start" onPointerDownOutside={(e) => e.preventDefault()}>
                                    <Calendar
                                        locale={bg}
                                        mode="single"
                                        selected={parseDate(field.value)}
                                        onSelect={(date) => {
                                            field.onChange(date);
                                            setIsPaymentOpen(false);
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            {showReasonField && (
                <div className="pt-2">
                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Причина (Гаранция, мостра и др.)</FormLabel>
                                <FormControl><Textarea {...field} value={field.value || ''} placeholder="Напр. Гаранционна подмяна..." /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            )}
        </div>
    );
}
