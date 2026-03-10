"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AnalyticsDashboard } from "@/components/app/analytics-dashboard";
import { useAppData } from "@/hooks/use-app-data";
import { useUser } from "@/firebase/auth/use-user";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const pathname = "/analytics";
  const { 
    orders, 
    fixedExpenses, 
    monthlyExpenses, 
    variableExpenses, 
    monthlyIncomes, 
    isDataLoaded 
  } = useAppData();
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold tracking-tight">Аналитично табло</h1>
            <SidebarTrigger className="md:hidden" />
          </div>
          {isDataLoaded ? (
             orders.length > 0 ? (
                <AnalyticsDashboard 
                  orders={orders} 
                  fixedExpenses={fixedExpenses}
                  monthlyExpenses={monthlyExpenses}
                  variableExpenses={variableExpenses}
                  monthlyIncomes={monthlyIncomes}
                />
              ) : (
                <div className="text-center p-8 text-muted-foreground">Няма данни за генериране на анализи.</div>
              )
          ) : (
            <div className="text-center p-8">Зареждане на данни...</div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
