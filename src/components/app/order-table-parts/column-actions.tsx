"use client";

import * as React from "react";
import { Trash2, Edit, FileText, Copy, MoreHorizontal } from "lucide-react";
import type { Row } from "@tanstack/react-table";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { Order, ProtocolType } from "@/lib/schemas";


export const DataTableRowActions = ({
  row,
  deleteOrder,
  onEdit,
  onShowProtocol,
  onDuplicate,
}: {
  row: Row<Order>;
  deleteOrder: (id: string) => void;
  onEdit: (order: Order) => void;
  onShowProtocol: (order: Order, type: ProtocolType) => void;
  onDuplicate: (order: Order) => void;
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const order = row.original;
  const hasReturnDate = order.items.some(item => item.returnDate);

  return (
    <>
      {/* Mobile & Tablet View: Dropdown Menu */}
      <div className="flex items-center justify-end lg:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Отвори меню</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(order)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Редактирай</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(order)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Дублирай</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => onShowProtocol(order, 'receive')}>
               <FileText className="mr-2 h-4 w-4" />
              <span>Протокол (приемане)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onShowProtocol(order, 'return')} disabled={!hasReturnDate}>
               <FileText className="mr-2 h-4 w-4" />
              <span>Протокол (връщане)</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Изтрий</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Desktop View: Icon Buttons */}
      <div className="hidden lg:inline-flex items-center justify-end rounded-md bg-muted/50 p-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" title="Редактирай" onClick={() => onEdit(order)}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">Редактирай</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" title="Дублирай" onClick={() => onDuplicate(order)}>
              <Copy className="h-4 w-4" />
              <span className="sr-only">Дублирай</span>
          </Button>

          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" title="Протоколи">
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Протоколи</span>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => onShowProtocol(order, 'receive')}>
                      Протокол (приемане)
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onShowProtocol(order, 'return')} disabled={!hasReturnDate}>
                      Протокол (връщане)
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-background hover:text-destructive" title="Изтрий" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Изтрий</span>
          </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Наистина ли сте сигурни?</AlertDialogTitle>
            <AlertDialogDescription>
              Това действие не може да бъде отменено. Това ще изтрие перманентно поръчка #{order.orderNumber}
              и ще премахне данните й от нашите сървъри.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отказ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteOrder(order.id)}
            >
              Изтрий
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
