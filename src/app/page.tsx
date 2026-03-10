
"use client";

import * as React from "react";
import OrderlyDashboard from "@/components/app/orderly-dashboard";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useUser } from "@/firebase/auth/use-user";

function HomeWithSearchParams() {
  const pathname = "/";
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order');
  const initialFilter = searchParams.get('filter');
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
        <div>Зареждане на потребител...</div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar pathname={pathname} />
      <SidebarInset>
        <OrderlyDashboard orderIdFromUrl={orderId} initialFilter={initialFilter} />
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeWithSearchParams />
    </Suspense>
  );
}
