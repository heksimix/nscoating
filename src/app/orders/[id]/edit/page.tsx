"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAppData } from "@/hooks/use-app-data";
import { useUser } from "@/firebase/auth/use-user";
import type { Order, OrderFormData } from "@/lib/schemas";
import { SidebarInset } from "@/components/ui/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AddOrderForm } from "@/components/app/add-order-form";
import { Skeleton } from "@/components/ui/skeleton";

function EditOrderPageContent() {
    const params = useParams();
    const router = useRouter();
    const { orders, clients, updateOrder, isDataLoaded } = useAppData();
    const { user, isLoading: isUserLoading } = useUser();
    
    const orderId = params.id as string;
    const [order, setOrder] = React.useState<Order | null>(null);

    React.useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        }
    }, [user, isUserLoading, router]);

    React.useEffect(() => {
        if (isDataLoaded) {
            const foundOrder = orders.find(o => o.id === orderId);
            if (foundOrder) {
                setOrder(foundOrder);
            } else {
                router.push('/');
            }
        }
    }, [orderId, orders, isDataLoaded, router]);

    const handleUpdate = (values: OrderFormData) => {
        if (order) {
            updateOrder({ ...values, id: order.id, orderNumber: order.orderNumber });
        }
        router.push('/');
    };

    if (isUserLoading || !isDataLoaded || !order) {
        return (
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-7 w-48" />
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96 mt-2" />
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </main>
        );
    }
    
    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Назад</span>
                </Button>
                <h1 className="text-xl font-semibold tracking-tight">Редактиране на поръчка</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Поръчка #{order.orderNumber}</CardTitle>
                    <CardDescription>
                        Направете промени по поръчката тук. Натиснете &quot;Запази промените&quot;, когато сте готови.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <AddOrderForm
                        order={order}
                        clients={clients}
                        onUpdateOrder={handleUpdate}
                        onAddOrder={() => {}} 
                    />
                </CardContent>
            </Card>
        </main>
    );
}


export default function EditOrderPage() {
    return (
        <SidebarInset>
            <EditOrderPageContent />
        </SidebarInset>
    );
}
