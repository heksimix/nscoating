
"use client";

import * as React from "react";
import ReportGenerator from "@/components/app/report-generator";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useAppData } from "@/hooks/use-app-data";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const { orders, isDataLoaded } = useAppData();
  const pathname = "/reports";
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
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {isDataLoaded ? (
            <ReportGenerator orders={orders} />
          ) : (
            <div className="text-center p-8">Зареждане на данните за отчета...</div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
