"use client";

import * as React from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/firebase";
import { updateProfile, updatePassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

const nameFormSchema = z.object({
  displayName: z.string().min(2, "Името трябва да е поне 2 символа."),
});

const passwordFormSchema = z.object({
  newPassword: z.string().min(6, "Паролата трябва да е поне 6 символа."),
  confirmPassword: z.string().min(6, "Паролата трябва да е поне 6 символа."),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Паролите не съвпадат.",
  path: ["confirmPassword"],
});

export default function ProfilePage() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  
  const nameForm = useForm<z.infer<typeof nameFormSchema>>({
    resolver: zodResolver(nameFormSchema),
    defaultValues: {
      displayName: "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (user) {
      nameForm.setValue('displayName', user.displayName || "");
    }
  }, [user, isLoading, router, nameForm]);

  if (isLoading || !user) {
    return <div className="flex h-screen items-center justify-center">Зареждане...</div>;
  }
  
  const handleNameUpdate = async (values: z.infer<typeof nameFormSchema>) => {
    if (!user) return;
    try {
        await updateProfile(user, { displayName: values.displayName });
        toast({ title: "Успех!", description: "Вашето име беше променено успешно." });
    } catch (error) {
        console.error("Error updating profile name:", error);
        toast({ title: "Грешка", description: "Възникна грешка при промяната на името.", variant: "destructive" });
    }
  };
  
  const handlePasswordUpdate = async (values: z.infer<typeof passwordFormSchema>) => {
    if (!user) return;
    try {
        await updatePassword(user, values.newPassword);
        toast({ title: "Успех!", description: "Вашата парола беше променена успешно. Моля, влезте отново." });
        if(auth) await auth.signOut();
        router.push('/login');
    } catch (error) {
        console.error("Error updating password:", error);
        toast({ title: "Грешка", description: "Възникна грешка при промяната на паролата. Може да е необходимо да влезете отново, преди да опитате.", variant: "destructive" });
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar pathname="/profile" />
      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Потребителски профил</CardTitle>
                            <CardDescription>Управлявайте вашите данни тук.</CardDescription>
                        </div>
                        <SidebarTrigger className="md:hidden" />
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <Form {...nameForm}>
                        <form onSubmit={nameForm.handleSubmit(handleNameUpdate)} className="space-y-4">
                            <CardTitle className="text-lg">Промяна на име</CardTitle>
                             <FormField
                                control={nameForm.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Име</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Вашето име" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <Button type="submit" disabled={nameForm.formState.isSubmitting}>Запази име</Button>
                        </form>
                    </Form>

                    <Separator />

                    <Form {...passwordForm}>
                        <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                            <CardTitle className="text-lg">Промяна на парола</CardTitle>
                             <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Нова парола</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                             <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Потвърди нова парола</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                                />
                            <Button type="submit" variant="destructive" disabled={passwordForm.formState.isSubmitting}>Промени парола</Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
