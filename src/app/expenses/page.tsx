"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { ExpensesManagement } from "@/components/app/expenses-management";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";

export default function ExpensesPage() {
  const pathname = "/expenses";
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

  return (
    <SidebarProvider>
      <AppSidebar pathname={pathname} />
      <SidebarInset>
        <ExpensesManagement />
      </SidebarInset>
    </SidebarProvider>
  );
}
