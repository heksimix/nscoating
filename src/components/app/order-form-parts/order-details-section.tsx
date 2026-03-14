"use client";

import * as React from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { PlusCircle, Trash2, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { bg } from "date-fns/locale";

import type { OrderFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";


interface OrderDetailsSectionProps {
    form: UseFormReturn<OrderFormData>;
}

export function OrderDetailsSection({ form }: OrderDetailsSectionProps) {
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "items",
    });

    const watchedItems = form.watch("items");
    const totalWithoutVAT = (watchedItems || []).reduce((acc, item) => {
        const quantity = Number(item?.quantity) || 0;
        const price = Number(item?.priceWithoutVAT) || 0;
        return acc + (quantity * price);
    }, 0);
    const totalWithVAT = totalWithoutVAT * 1.20;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-medium">Детайли на поръчката</h3>
            <div className="space-y-4">
                {fields.map((field, index) => {
                    const item = watchedItems[index];
                    const lineTotal = (Number(item?.quantity) || 0) * (Number(item?.priceWithoutVAT) || 0);

                    return (
                         <div key={field.id} className="rounded-lg border bg-card p-4 shadow-sm">
                            <div className="flex w-full items-start gap-4">
                                <div className="grid flex-1 grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-12">
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.detailType`}
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-4">
                                                <FormLabel>Тип детайл</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.quantity`}
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Кол.</FormLabel>
                                                <FormControl><Input type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.valueAsNumber || 0)} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.priceWithoutVAT`}
                                        render={({ field }) => (
                                            <PriceInput field={field} />
                                        )}
                                    />
                                    <FormItem className="md:col-span-2">
                                        <FormLabel>Общо ред</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input readOnly value={lineTotal.toFixed(2)} className="font-semibold bg-muted text-right pr-6" />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">€</span>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                    <FormField
                                        control={form.control}
                                        name={`items.${index}.returnDate`}
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel>Дата на връщане</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                                {field.value ? format(new Date(field.value), "dd.MM.yy") : <span className="text-xs">Избери дата</span>}
                                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            locale={bg}
                                                            mode="single"
                                                            selected={field.value ? new Date(field.value) : undefined}
                                                            onSelect={field.onChange}
                                                            disabled={(date) => date < new Date(form.getValues("receivedDate"))}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="mt-8">
                                    {fields.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:bg-destructive/10 h-9 w-9"
                                            onClick={() => remove(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-6 flex flex-col items-stretch gap-4 sm:flex-row sm:justify-between sm:items-start">
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => append({ detailType: "", quantity: 1, priceWithoutVAT: null })}>
                    <PlusCircle className="h-4 w-4" />
                    Добави детайл
                </Button>
                
                <div className="w-full sm:max-w-xs space-y-2 rounded-lg border bg-muted/50 p-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Общо без ДДС</span>
                        <span className="font-medium">{totalWithoutVAT.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">ДДС (20%)</span>
                        <span className="font-medium">{(totalWithoutVAT * 0.20).toFixed(2)} €</span>
                    </div>
                    <Separator className="my-2 bg-muted-foreground/20" />
                    <div className="flex justify-between text-base font-semibold">
                        <span>Крайна сума</span>
                        <span>{totalWithVAT.toFixed(2)} €</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PriceInput({ field }: { field: any }) {
    const [localValue, setLocalValue] = React.useState(
        field.value !== null && field.value !== undefined ? field.value.toString() : ""
    );

    React.useEffect(() => {
        const fieldNum = field.value !== null && field.value !== undefined ? parseFloat(field.value) : null;
        const localNum = localValue !== "" ? parseFloat(localValue.replace(',', '.')) : null;
        
        if (fieldNum !== localNum) {
            setLocalValue(fieldNum !== null ? fieldNum.toString() : "");
        }
    }, [field.value, localValue]);

    return (
        <FormItem className="md:col-span-2">
            <FormLabel>Цена без ДДС (€)</FormLabel>
            <FormControl>
                <div className="relative">
                    <Input 
                        type="text" 
                        inputMode="decimal"
                        placeholder="0.00"
                        value={localValue}
                        onChange={e => {
                            const val = e.target.value.replace(',', '.');
                            setLocalValue(val);
                            const num = parseFloat(val);
                            field.onChange(isNaN(num) ? null : num);
                        }}
                        onBlur={() => {
                            const num = parseFloat(localValue.replace(',', '.'));
                            if (!isNaN(num)) {
                                setLocalValue(num.toFixed(2));
                            }
                            field.onBlur();
                        }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">€</span>
                </div>
            </FormControl>
            <FormMessage />
        </FormItem>
    );
}
