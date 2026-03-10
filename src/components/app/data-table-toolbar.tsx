'use client'

import { X } from "lucide-react"
import { Table } from "@tanstack/react-table"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"

import { QuickFilters } from "./quick-filters"
import { DateRangePicker } from "@/components/ui/date-range-picker"


interface DataTableToolbarProps<TData> {
  table: Table<TData>
  dateRange: DateRange | undefined
  onDateRangeChange: (date: DateRange | undefined) => void
}

export function DataTableToolbar<TData>({
  table,
  dateRange,
  onDateRangeChange
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || dateRange

  const handleResetFilters = () => {
    table.resetColumnFilters()
    onDateRangeChange(undefined)
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 lg:flex-row lg:items-center lg:space-x-2">
        <Input
            placeholder="Търсене по клиент..."
            value={(table.getColumn("client")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
                table.getColumn("client")?.setFilterValue(event.target.value)
            }
            className="h-8 w-full lg:w-[250px]"
        />
        <DateRangePicker date={dateRange} onDateChange={onDateRangeChange} />
        <QuickFilters table={table} className="w-full lg:w-auto" />
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={handleResetFilters}
            className="h-8 w-full px-2 lg:w-auto lg:px-3"
          >
            Изчисти
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
