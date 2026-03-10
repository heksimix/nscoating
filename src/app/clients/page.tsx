"use client";

import * as React from "react";
import { ClientManagement } from "@/components/app/client-management";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { AddClientForm } from "@/components/app/add-client-form";
import { useAppData } from "@/hooks/use-app-data";
import type { Client } from "@/lib/schemas";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const pathname = "/clients";
  const { addClient } = useAppData();
  const [isAddClientOpen, setAddClientOpen] = React.useState(false);
  const { user, isLoading } = useUser();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div>Зареждане...</div>
      </div>
    );
  }


  const handleAddClient = (newClientData: Omit<Client, "id">) => {
    addClient(newClientData);
    setAddClientOpen(false);
  };

  return (
    <SidebarProvider>
      <AppSidebar pathname={pathname} />
      <SidebarInset>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <Card className="shadow-sm">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                     <div className="flex items-center justify-between">
                        <CardTitle>Клиенти</CardTitle>
                        <SidebarTrigger className="md:hidden" />
                    </div>
                    <div className="w-full lg:w-auto">
                        <Dialog open={isAddClientOpen} onOpenChange={setAddClientOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="w-full gap-1 lg:w-auto">
                              <PlusCircle className="h-4 w-4" />
                              Добави нов клиент
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-2xl w-[90vw]">
                            <DialogHeader>
                              <DialogTitle>Добави нов клиент</DialogTitle>
                               <DialogDescription>
                                Попълнете формата, за да добавите нов клиент към списъка.
                              </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[75vh] -mx-6 px-6">
                              <AddClientForm onAddClient={handleAddClient} />
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <ClientManagement />
                </CardContent>
            </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
