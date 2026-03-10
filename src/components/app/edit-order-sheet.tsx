"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddOrderForm } from "./add-order-form";
import type { Order, Client, OrderFormData } from "@/lib/schemas";
import { ScrollArea } from "../ui/scroll-area";
import { useRouter } from "next/navigation";

type EditOrderDialogProps = {
  order: Order | null;
  clients: Client[];
  onUpdateOrder: (order: Partial<Order>) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function EditOrderDialog({
  order,
  clients,
  onUpdateOrder,
  isOpen,
  onClose,
}: EditOrderDialogProps) {
  const router = useRouter();

  const handleUpdate = (values: OrderFormData) => {
    if (order) {
      onUpdateOrder({ ...values, id: order.id, orderNumber: order.orderNumber });
    }
    onClose();
  }

  // Redirect to the edit page when the dialog is supposed to open.
  React.useEffect(() => {
    if (isOpen && order) {
      onClose(); // Close the dialog immediately
      router.push(`/orders/${order.id}/edit`);
    }
  }, [isOpen, order, router, onClose]);

  // This component will no longer render its own UI, but the logic is kept
  // in case it's needed for other purposes. It effectively acts as a redirector.
  return null;
}
