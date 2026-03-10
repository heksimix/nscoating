"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Image from "next/image";

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
import { useCompanyData } from "@/hooks/use-company-data";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const companyDataSchema = z.object({
  name: z.string().min(2, "Името на фирмата е задължително."),
  address: z.string().min(5, "Адресът е задължителен."),
  eik: z.string().min(9, "ЕИК трябва да е поне 9 символа."),
  mol: z.string().min(3, "МОЛ е задължително поле."),
  logoUrl: z.string().optional().nullable(),
});

type CompanyDataFormValues = z.infer<typeof companyDataSchema>;

interface CompanySettingsFormProps {
    onClose: () => void;
}

export function CompanySettingsForm({ onClose }: CompanySettingsFormProps) {
  const { companyData, setCompanyData } = useCompanyData();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<CompanyDataFormValues>({
    resolver: zodResolver(companyDataSchema),
    defaultValues: companyData,
  });
  
  React.useEffect(() => {
    form.reset(companyData);
  }, [companyData, form]);


  function onSubmit(values: CompanyDataFormValues) {
    setCompanyData(values);
    toast({
      title: "Настройките са запазени",
      description: "Данните на вашата фирма бяха успешно обновени.",
    });
    onClose();
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("logoUrl", reader.result as string, { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const logoValue = form.watch("logoUrl");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Име на фирмата</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Адрес</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>ЕИК / Булстат</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>МОЛ</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="logoUrl"
          render={({ field }) => (
            <FormItem>
                <FormLabel>Фирмено лого</FormLabel>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                     {logoValue && (
                      <div className="relative w-24 h-24 border rounded-md p-2 shrink-0">
                        <Image src={logoValue} alt="Лого" layout="fill" objectFit="contain" />
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           className="absolute -top-3 -right-3 h-7 w-7 rounded-full bg-destructive/80 text-destructive-foreground hover:bg-destructive"
                           onClick={() => form.setValue("logoUrl", "")}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                      </div>
                  )}
                    <Tabs defaultValue="upload" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">Качи файл</TabsTrigger>
                            <TabsTrigger value="url">От URL адрес</TabsTrigger>
                        </TabsList>
                        <TabsContent value="upload" className="mt-4">
                            <FormControl>
                                <div>
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Избери файл
                                    </Button>
                                    <Input 
                                        type="file" 
                                        className="hidden" 
                                        ref={fileInputRef} 
                                        onChange={handleFileChange}
                                        accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                    />
                                </div>
                            </FormControl>
                        </TabsContent>
                        <TabsContent value="url" className="mt-4">
                            <FormControl>
                                <Input 
                                    value={field.value || ''}
                                    onChange={(e) => field.onChange(e.target.value)}
                                />
                            </FormControl>
                        </TabsContent>
                    </Tabs>
                </div>
                <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Запазване..." : "Запази"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
