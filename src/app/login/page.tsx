"use client";

import * as React from "react";
import {
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useAuth } from "@/firebase";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Моля, въведете валиден имейл."),
  password: z.string().min(1, "Моля, въведете парола."),
});

type FormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const auth = useAuth();
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [firebaseError, setFirebaseError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    if (!isLoading && user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  const handleAuthAction = async (values: FormValues) => {
    if (!auth) return;
    setFirebaseError(null);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      router.push("/");
    } catch (error: any) {
      let message = "Възникна грешка при входа. Моля, опитайте отново.";
      switch (error.code) {
        case "auth/invalid-email":
          message = "Невалиден имейл адрес.";
          break;
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          message = "Грешен имейл или парола.";
          break;
        case "auth/too-many-requests":
          message = "Твърде много неуспешни опити. Моля, опитайте по-късно.";
          break;
        default:
          console.error("Authentication error:", error);
      }
      setFirebaseError(message);
    }
  };

  if (isLoading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <p>Зареждане...</p>
      </div>
    );
  }

  return (
    <main className="flex h-screen w-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Вход в системата</CardTitle>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleAuthAction)}>
            <CardContent className="space-y-4">
              {firebaseError && (
                  <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Грешка</AlertTitle>
                      <AlertDescription>{firebaseError}</AlertDescription>
                  </Alert>
              )}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имейл</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Парола</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                   {form.formState.isSubmitting ? "Проверка..." : "Вход"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Form>
      </Card>
    </main>
  );
}
