"use client";

import * as React from "react";
import { ArrowUpDown, Filter } from "lucide-react";
import type { Column } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import type { Order } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const DataTableColumnHeader = ({ column, title, className }: { column: any, title: string, className?: string }) => {
  return (
    <div
      className={cn("flex items-center space-x-2", column.getCanSort() ? 'cursor-pointer select-none' : '', className)}
      onClick={() => column.getCanSort() && column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span>{title}</span>
      {column.getCanSort() && <ArrowUpDown className="ml-2 h-4 w-4" />}
    </div>
  );
};

export const ClientFilterHeader = ({ column, title }: { column: Column<Order, unknown>, title: string }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const filterValue = (column.getFilterValue() as string) ?? "";
  
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-auto p-0 -ml-2">
            <div className="flex items-center space-x-2 cursor-pointer select-none">
                <span>{title}</span>
                <Filter className={cn("h-4 w-4", filterValue ? 'text-primary' : 'text-muted-foreground/50' )} />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <Input
            placeholder="Филтър по клиент..."
            value={filterValue}
            onChange={(event) => column.setFilterValue(event.target.value)}
            className="h-8"
          />
        </PopoverContent>
      </Popover>
    );
};
