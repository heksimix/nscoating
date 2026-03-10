"use client"

import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu"
import { SlidersHorizontal } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface DataTableViewOptionsProps<TData> {
  table: Table<TData>
}

const columnTranslations: Record<string, string> = {
  orderNumber: "№",
  client: "Клиент",
  detailType: "Тип детайл",
  receivedDate: "Получена",
  quantity: "Количество",
  priceWithoutVAT: "Ед. цена (€)",
  paymentStatus: "Плащане",
  returnDate: "Върната",
  totalWithoutVAT: "Общо (€)",
  actions: "Действия"
};


export function DataTableViewOptions<TData>({
  table,
}: DataTableViewOptionsProps<TData>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto hidden h-8 lg:flex"
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Изглед
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Превключи колони</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {table
          .getAllColumns()
          .filter(
            (column) =>
              typeof column.accessorFn !== "undefined" && column.getCanHide()
          )
          .map((column) => {
            const columnId = column.id.replace(/[^a-zA-Z0-9]/g, '_');
            const displayName = columnTranslations[column.id] || column.id.replace(/([A-Z])/g, ' $1').trim();
            return (
              <DropdownMenuCheckboxItem
                key={columnId}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {displayName}
              </DropdownMenuCheckboxItem>
            )
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
