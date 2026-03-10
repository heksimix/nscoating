'use client';

import * as React from "react";
import { PlusCircle } from "lucide-react";
import type { SortingState, ColumnFiltersState } from "@tanstack/react-table";
import type { DateRange } from "react-day-picker";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

import type { Order, OrderFormData, ProtocolType } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAppData } from "@/hooks/use-app-data";
import { AddOrderForm } from "./add-order-form";
import { getColumns } from "./order-columns";
import { DataTable } from "./data-table";
import { ProtocolPopup } from "./protocol-popup";
import { SidebarTrigger } from "../ui/sidebar";
import { ScrollArea } from "../ui/scroll-area";
import { useRouter } from "next/navigation";

type ActiveProtocol = { order: Order; type: ProtocolType } | null;

export default function OrderlyDashboard({ orderIdFromUrl, initialFilter }: { orderIdFromUrl: string | null; initialFilter: string | null }) {
  const router = useRouter();
  const { 
    orders, 
    clients, 
    isDataLoaded, 
    addOrder,
    addClient,
    updateOrder,
    deleteOrder,
  } = useAppData();

  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const [duplicateOrderData, setDuplicateOrderData] = React.useState<OrderFormData | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'orderNumber', desc: true }
  ]);
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
  const [activeProtocol, setActiveProtocol] = React.useState<ActiveProtocol>(null);
  const [showConfirmClientDialog, setShowConfirmClientDialog] = React.useState(false);
  const [pendingOrder, setPendingOrder] = React.useState<OrderFormData | null>(null);

  const initialColumnFilters = React.useMemo<ColumnFiltersState>(() => {
    if (initialFilter === 'unpaid') {
      return [{ id: 'paymentStatus', value: ['Неплатено'] }];
    }
    return [];
  }, [initialFilter]);

  const completeAddOrder = React.useCallback(async (orderData: OrderFormData, shouldAddNewClient: boolean) => {
      if (shouldAddNewClient) {
          const newClient = await addClient({
              name: orderData.client,
              address: null,
              eik: null,
              contacts: (orderData.contactPerson || orderData.phone) ? [{
                  name: orderData.contactPerson || orderData.client,
                  phone: orderData.phone || null
              }] : []
          });
          if (!newClient) return; // Stop if client creation failed (e.g., duplicate)
      }
      addOrder(orderData);
      setAddDialogOpen(false);
      setPendingOrder(null);
      setShowConfirmClientDialog(false);
  }, [addClient, addOrder]);

  const handleAddOrder = React.useCallback(async (newOrderData: OrderFormData) => {
    const trimmedName = newOrderData.client.trim().toLowerCase();
    const clientExists = clients.some(c => c.name.trim().toLowerCase() === trimmedName);
    
    if (!clientExists && newOrderData.client.trim() !== '') {
        setPendingOrder(newOrderData);
        setShowConfirmClientDialog(true);
    } else {
       await completeAddOrder(newOrderData, false);
    }
  }, [clients, completeAddOrder]);

  const handleUpdateOrder = React.useCallback((orderUpdate: Partial<Order>) => {
    updateOrder(orderUpdate);
  }, [updateOrder]);
  
  const handleEdit = React.useCallback((order: Order) => {
    router.push(`/orders/${order.id}/edit`);
  }, [router]);

  const handleDuplicate = React.useCallback((orderToDuplicate: Order) => {
    const newOrderData: OrderFormData = {
        client: orderToDuplicate.client,
        contactPerson: orderToDuplicate.contactPerson,
        phone: orderToDuplicate.phone,
        items: orderToDuplicate.items.map(item => ({
            detailType: item.detailType,
            quantity: item.quantity,
            priceWithoutVAT: item.priceWithoutVAT,
            returnDate: undefined, // Clear return date for each item
        })),
        paymentMethod: orderToDuplicate.paymentMethod,
        paymentStatus: 'Неплатено', // Always reset status
        receivedDate: new Date(), // Always set to today
        reason: null, // Clear reason
        paymentDate: undefined, // Clear payment date
    };
    setDuplicateOrderData(newOrderData);
    setAddDialogOpen(true);
  }, []);
  
  const filteredOrders = React.useMemo(() => {
    if (!dateRange?.from) {
      return orders;
    }
    const from = startOfDay(dateRange.from);
    const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    return orders.filter(order => {
      const received = new Date(order.receivedDate);
      
      const receivedInInterval = isWithinInterval(received, { start: from, end: to });
      const returnedInInterval = order.items.some(item => 
        item.returnDate && isWithinInterval(new Date(item.returnDate), { start: from, end: to })
      );

      return receivedInInterval || returnedInInterval;
    });
  }, [orders, dateRange]);

  React.useEffect(() => {
    if (orderIdFromUrl && isDataLoaded && orders.length > 0) {
        handleEdit(orders.find(o => o.id === orderIdFromUrl)!);
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.delete('order');
        window.history.replaceState({ ...window.history.state, as: currentUrl.pathname, url: currentUrl.toString() }, '', currentUrl.toString());
    }
  }, [orderIdFromUrl, isDataLoaded, orders, handleEdit]);


  const handleShowProtocol = React.useCallback((order: Order, type: ProtocolType) => {
    setActiveProtocol({ order, type });
  }, []);

  const columns = React.useMemo(() => getColumns({ deleteOrder, onEdit: handleEdit, updateOrder: handleUpdateOrder, onShowProtocol: handleShowProtocol, onDuplicate: handleDuplicate }), [deleteOrder, handleEdit, handleUpdateOrder, handleShowProtocol, handleDuplicate]);
  
  const handleAddDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
        setDuplicateOrderData(null);
    }
    setAddDialogOpen(isOpen);
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center justify-between">
               <CardTitle>Поръчки</CardTitle>
               <SidebarTrigger className="md:hidden" />
            </div>
            <div className="w-full lg:w-auto">
               <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogChange}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1 w-full lg:w-auto">
                    <PlusCircle className="h-4 w-4" />
                    Добави поръчка
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-5xl w-[90vw]">
                  <DialogHeader>
                    <DialogTitle>Добави нова поръчка</DialogTitle>
                     <DialogDescription>Попълнете формата, за да добавите нова поръчка.</DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[calc(100vh_-_10rem)] -mx-6 px-6">
                    <AddOrderForm 
                        key={duplicateOrderData ? `duplicate-${Date.now()}` : 'new'}
                        onAddOrder={handleAddOrder} 
                        clients={clients}
                        initialData={duplicateOrderData}
                    />
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
             {isDataLoaded ? (
                <DataTable 
                    columns={columns} 
                    data={filteredOrders} 
                    sorting={sorting}
                    onSortingChange={setSorting}
                    meta={{ onEdit: handleEdit, clients, updateOrder: handleUpdateOrder, deleteOrder, onShowProtocol: handleShowProtocol, onDuplicate: handleDuplicate }}
                    initialColumnFilters={initialColumnFilters}
                    dateRange={dateRange}
                    onDateRangeChange={setDateRange}
                />
             ) : (
                <div className="text-center p-8">Зареждане на данни...</div>
             )}
          </CardContent>
        </Card>

      </main>
      
       {activeProtocol && (
         <ProtocolPopup 
           isOpen={!!activeProtocol}
           onClose={() => setActiveProtocol(null)}
           order={activeProtocol.order}
           clients={clients}
           type={activeProtocol.type}
         />
       )}

       <AlertDialog open={showConfirmClientDialog} onOpenChange={setShowConfirmClientDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Нов клиент</AlertDialogTitle>
            <AlertDialogDescription>
              Клиент с името '{pendingOrder?.client}' не съществува. Искате ли да го добавите към списъка с клиенти?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
                if (pendingOrder) {
                  completeAddOrder(pendingOrder, false);
                }
            }}>Не, продължи</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingOrder && completeAddOrder(pendingOrder, true)}>
              Да, добави
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
