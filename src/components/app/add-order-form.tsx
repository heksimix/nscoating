"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { Order, Client, OrderFormData } from "@/lib/schemas";
import { orderFormSchema } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ClientInfoSection } from "./order-form-parts/client-info-section";
import { OrderDetailsSection } from "./order-form-parts/order-details-section";
import { DateAndPaymentSection } from "./order-form-parts/date-and-payment-section";

type AddOrderFormProps = {
  order?: Order | null;
  onAddOrder: (order: OrderFormData) => void;
  onUpdateOrder?: (order: OrderFormData) => void;
  clients: Client[];
  initialData?: OrderFormData | null;
};

export function AddOrderForm({ onAddOrder, onUpdateOrder, order, clients, initialData }: AddOrderFormProps) {
  const isEditMode = !!order;
  
  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialData ?? (isEditMode && order ? {
      ...order,
      receivedDate: new Date(order.receivedDate),
      paymentDate: order.paymentDate ? new Date(order.paymentDate) : null,
      returnDate: order.returnDate ? new Date(order.returnDate) : null,  // ← това липсва
      reason: order.reason || '',
      contactPerson: order.contactPerson || '',
      items: (order.items || []).map((item: any) => ({
        ...item,
        priceWithoutVAT: item.priceWithoutVAT ?? null,
        returnDate: item.returnDate ? new Date(item.returnDate) : null,
      }))
    } : {
      client: "",
      contactPerson: "",
      phone: "",
      items: [{ detailType: "", quantity: 1, priceWithoutVAT: null, returnDate: null }],
      paymentMethod: "В брой",
      paymentStatus: "Неплатено",
      receivedDate: new Date(),
      reason: "",
      paymentDate: null,
      returnDate: null,
    }),
  });

  function onSubmit(values: OrderFormData) {
    if (isEditMode && onUpdateOrder && order) {
        onUpdateOrder(values);
    } else {
        onAddOrder(values);
    }
    if (!isEditMode) {
      form.reset({
        client: "",
        contactPerson: "",
        phone: "",
        items: [{ detailType: "", quantity: 1, priceWithoutVAT: null, returnDate: null }], // промени на null
        paymentMethod: "В брой",
        paymentStatus: "Неплатено",
        receivedDate: new Date(),
        reason: "",
        paymentDate: null, // промени на null
      });
    }
  }

  return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
          <ClientInfoSection form={form} clients={clients} />
          <OrderDetailsSection form={form} />
          <DateAndPaymentSection form={form} />
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (isEditMode ? "Запазване..." : "Добавяне...") : (isEditMode ? "Запази промените" : "Добави поръчка")}
            </Button>
          </div>
        </form>
      </Form>
  );
}
