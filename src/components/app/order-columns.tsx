"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";

import type { Order, ProtocolType } from "@/lib/schemas";
import { DataTableRowActions } from "./order-table-parts/column-actions";
import { DataTableColumnHeader, ClientFilterHeader } from "./order-table-parts/column-headers";
import { EditableDateCell, EditableTextCell, EditablePaymentInfoCell, EditableOrderNumberCell } from "./order-table-parts/column-cells";

export const getColumns = ({ deleteOrder, onEdit, updateOrder, onShowProtocol, onDuplicate }: { 
    deleteOrder: (id: string) => void; 
    onEdit: (order: Order) => void; 
    updateOrder: (order: Partial<Order>) => void; 
    onShowProtocol: (order: Order, type: ProtocolType) => void;
    onDuplicate: (order: Order) => void;
}): ColumnDef<Order>[] => [
  {
    accessorKey: "orderNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="№" />,
    cell: EditableOrderNumberCell,
    size: 80,
  },
  {
    accessorKey: "client",
    header: ({ column }) => <ClientFilterHeader column={column} title="Клиент" />,
    cell: ({ row }) => {
        const order = row.original;
        return (
            <div className="flex flex-col gap-0.5">
                <span className="font-medium truncate">{order.client}</span>
                <div className="flex flex-col text-xs text-muted-foreground">
                    {order.contactPerson && <span className="truncate">{order.contactPerson}</span>}
                    {order.phone && <span className="truncate">тел. {order.phone}</span>}
                </div>
            </div>
        )
    },
    size: 200,
    enableSorting: false,
  },
  {
    accessorKey: 'detailType',
    header: 'Тип детайл',
    cell: ({ row, table }) => {
        const order = row.original;
        return (
            <div className="flex flex-col gap-y-2">
                {order.items.map((item, itemIndex) => {
                    const cellProps = { getValue: () => item.detailType, row, column: { id: 'detailType' }, table, itemIndex };
                    return <EditableTextCell key={itemIndex} {...cellProps} />;
                })}
            </div>
        );
    },
    size: 200,
  },
  {
    accessorKey: 'quantity',
    header: () => <div className="text-center">Кол.</div>,
    cell: ({ row, table }) => {
        const order = row.original;
        return (
            <div className="flex flex-col gap-y-2">
                {order.items.map((item, itemIndex) => {
                    const cellProps = { getValue: () => item.quantity, row, column: { id: 'quantity' }, table, itemIndex };
                    return <EditableTextCell key={itemIndex} {...cellProps} />;
                })}
            </div>
        );
    },
    size: 80,
  },
   {
    accessorKey: 'priceWithoutVAT',
    header: () => <div className="text-right">Ед. цена (€)</div>,
    cell: ({ row, table }) => {
        const order = row.original;
        return (
            <div className="flex flex-col gap-y-2">
                {order.items.map((item, itemIndex) => {
                    const cellProps = { getValue: () => item.priceWithoutVAT, row, column: { id: 'priceWithoutVAT' }, table, itemIndex };
                    return <EditableTextCell key={itemIndex} {...cellProps} />;
                })}
            </div>
        );
    },
    size: 120,
  },
  {
    accessorKey: 'totalWithoutVAT',
    header: () => <div className="text-right">Общо (€)</div>,
    cell: ({ row }) => {
      const order = row.original;
      const amount = order.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.priceWithoutVAT || 0), 0);
      const amountWithVAT = amount * 1.20;
      const formatted = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amount).replace('.', ',');
      const formattedWithVAT = new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amountWithVAT).replace('.', ',');
      return (
        <div className="text-right font-medium">
            <div>{formatted}</div>
            <div className="text-xs text-muted-foreground font-normal">с ДДС: {formattedWithVAT}</div>
        </div>
      );
    },
     enableSorting: false,
     size: 120,
  },
  {
    accessorKey: "paymentStatus",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Плащане" />,
    cell: EditablePaymentInfoCell,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    size: 150,
  },
  {
    accessorKey: "receivedDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Получена" />,
    cell: EditableDateCell,
    size: 100,
  },
  {
    accessorKey: "returnDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Върната" />,
    cell: ({ row, table }) => {
        const order = row.original;
        return (
            <div className="flex flex-col gap-y-2">
                {order.items.map((item, itemIndex) => {
                    const cellProps = { 
                        getValue: () => item.returnDate, 
                        row, 
                        column: { id: 'returnDate' }, 
                        table, 
                        itemIndex 
                    };
                    return <EditableDateCell key={itemIndex} {...cellProps} />;
                })}
            </div>
        );
    },
    size: 100,
  },
  {
    id: "actions",
    header: () => <div className="text-right">Действия</div>,
    cell: ({ row, table }) => {
        const meta = table.options.meta;
        if (!meta) return null;
        return <DataTableRowActions 
            row={row} 
            deleteOrder={meta.deleteOrder} 
            onEdit={meta.onEdit} 
            onShowProtocol={meta.onShowProtocol} 
            onDuplicate={meta.onDuplicate} 
        />;
    },
    enableSorting: false,
    enableHiding: false,
    size: 80,
    enableResizing: false,
  },
];
