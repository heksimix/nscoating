"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { Client } from "@/lib/schemas";
import { clientFormSchema } from "@/lib/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type AddClientFormProps = {
  onAddClient: (client: Omit<Client, "id"> | Client) => void;
  initialValues?: Client | null;
};

const LOCAL_STORAGE_KEY_PREFIX = "new-client-form-data";

export function AddClientForm({ onAddClient, initialValues }: AddClientFormProps) {
  const isEditMode = !!initialValues;
  const LOCAL_STORAGE_KEY = isEditMode ? `${LOCAL_STORAGE_KEY_PREFIX}-${initialValues.id}` : LOCAL_STORAGE_KEY_PREFIX;
  
  type FormValues = z.infer<typeof clientFormSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: isEditMode ? initialValues : {
      name: "",
      address: "",
      eik: "",
      contacts: [{ name: "", phone: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  // Load from and save to localStorage
  React.useEffect(() => {
    // For new clients only, persist form state.
    if(isEditMode) return;

    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        form.reset(parsedData);
      } catch (e) {
        console.error("Failed to parse client form data from localStorage", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }

    const subscription = form.watch((values) => {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(values));
    });

    return () => subscription.unsubscribe();
  }, [form, LOCAL_STORAGE_KEY, isEditMode]);


  React.useEffect(() => {
    if (initialValues) {
        form.reset(initialValues);
    }
  }, [initialValues, form]);

  function onSubmit(values: FormValues) {
    onAddClient(values);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    if (!isEditMode) {
      form.reset({
        name: "",
        address: "",
        eik: "",
        contacts: [{ name: "", phone: "" }],
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
        <Card className="border-none shadow-none">
          <CardContent className="p-4 space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Клиент / Компания <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Адрес (незадължително)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="eik"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ЕИК / ЕГН (незадължително)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />
        
        <Card className="border-none shadow-none">
            <CardHeader className="p-4 pb-2">
                <CardTitle className="text-lg">Лица за контакт</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="rounded-lg border bg-background p-4 relative shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name={`contacts.${index}.name`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Име</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`contacts.${index}.phone`}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Телефон</FormLabel>
                                        <FormControl><Input {...field} value={field.value || ''} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {fields.length > 1 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => remove(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                ))}
                 <Button type="button" variant="outline" size="sm" className="gap-1 mt-4" onClick={() => append({ name: '', phone: '' })}>
                    <PlusCircle className="h-4 w-4" />
                    Добави лице за контакт
                </Button>
            </CardContent>
        </Card>

        <div className="flex justify-end p-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (isEditMode ? "Запазване..." : "Добавяне...") : (isEditMode ? "Запази промените" : "Добави клиент")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
