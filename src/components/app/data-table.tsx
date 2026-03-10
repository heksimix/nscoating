'use client'

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { format, isValid } from "date-fns";
import { bg } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar } from "./data-table-toolbar"
import { cn } from "@/lib/utils"
import { Order, Client } from "@/lib/schemas"
import { DataTableRowActions } from "./order-table-parts/column-actions"

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    clients: Client[];
    onEdit: (order: Order) => void;
    updateOrder: (order: Partial<Order>) => void;
    deleteOrder: (id: string) => void;
    onShowProtocol: (order: Order, type: 'receive' | 'return') => void;
    onDuplicate: (order: Order) => void;
  }
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  sorting: SortingState
  onSortingChange: React.Dispatch<React.SetStateAction<SortingState>>
  meta: {
    clients: Client[];
    onEdit: (order: Order) => void;
    updateOrder: (order: Partial<Order>) => void;
    deleteOrder: (id: string) => void;
    onShowProtocol: (order: Order, type: 'receive' | 'return') => void;
    onDuplicate: (order: Order) => void;
  }
  initialColumnFilters?: ColumnFiltersState;
  dateRange: DateRange | undefined;
  onDateRangeChange: (date: DateRange | undefined) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amount);
};

const formatDateSafe = (date: any, formatStr: string = "dd.MM.yyyy") => {
  if (!date) return "-";
  const d = new Date(date);
  if (!isValid(d)) return "-";
  return format(d, formatStr, { locale: bg });
};

const paymentStatusClasses: Record<string, string> = {
  "Платено": "bg-status-paid/10 text-status-paid border-status-paid/20",
  "Неплатено": "bg-status-unpaid/10 text-status-unpaid border-status-unpaid/20",
  "Няма": "bg-muted text-muted-foreground border-border"
};


export function DataTable<TData, TValue>({
  columns,
  data,
  sorting,
  onSortingChange,
  meta,
  initialColumnFilters,
  dateRange,
  onDateRangeChange
}: DataTableProps<TData, TValue>) {
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    initialColumnFilters || []
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      columnFilters,
    },
    onSortingChange: onSortingChange,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    meta,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} dateRange={dateRange} onDateRangeChange={onDateRangeChange} />
      
      {/* Desktop View */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      colSpan={header.colSpan} 
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                       {header.column.getCanResize() && (
                        <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={cn(
                                "absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none bg-border opacity-0 group-hover:opacity-100",
                                header.column.getIsResizing() && "bg-primary opacity-100"
                            )}
                        />
                       )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="align-top py-3 px-4"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Няма резултати.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile & Tablet View */}
      <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
        {table.getRowModel().rows?.length > 0 ? (
          table.getRowModel().rows.map((row) => {
            const order = row.original as Order;
            const totalWithVAT = order.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.priceWithoutVAT || 0), 0) * 1.2;

            return (
              <Card key={order.id} className="break-inside-avoid">
                  <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-bold break-words">#{order.orderNumber} / {order.client}</CardTitle>
                             <CardDescription className="mt-1 flex flex-col break-words">
                                {order.contactPerson && <span>{order.contactPerson}</span>}
                                {order.phone && <span>тел. {order.phone}</span>}
                              </CardDescription>
                        </div>
                        <DataTableRowActions row={row} {...table.options.meta} />
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                      <Separator />
                      
                      {/* Items */}
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start">
                            <div className="flex-1 pr-2">
                              <p className="font-medium break-words">{item.detailType}</p>
                              <p className="text-muted-foreground text-xs">{item.quantity} бр. x {formatCurrency(item.priceWithoutVAT || 0)}</p>
                            </div>
                            <p className="font-semibold">{formatCurrency((item.quantity || 0) * (item.priceWithoutVAT || 0))}</p>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      {/* Payment Status & Total */}
                      <div className="space-y-2">
                          <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Плащане:</span>
                              <Badge variant="outline" className={cn("text-xs", paymentStatusClasses[order.paymentStatus])}>
                                {order.paymentStatus}
                              </Badge>
                          </div>
                           <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Общо без ДДС:</span>
                              <span className="font-semibold">{formatCurrency(order.totalWithoutVAT)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Общо с ДДС:</span>
                              <span className="font-bold text-base">{formatCurrency(totalWithVAT)}</span>
                          </div>
                      </div>

                       <Separator />

                      {/* Dates */}
                       <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Получена:</span>
                              <span className="font-medium">{formatDateSafe(order.receivedDate)}</span>
                          </div>
                           <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Върната:</span>
                              <span className="font-medium">{formatDateSafe(order.returnDate)}</span>
                          </div>
                           <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Платена на:</span>
                              <span className="font-medium">{formatDateSafe(order.paymentDate)}</span>
                          </div>
                       </div>
                  </CardContent>
              </Card>
            )
          })
        ) : (
           <div className="text-center p-8 text-muted-foreground">Няма резултати.</div>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
