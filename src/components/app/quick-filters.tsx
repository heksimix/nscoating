"use client";

import { Button } from "@/components/ui/button";
import { Table } from "@tanstack/react-table";
import { XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickFiltersProps<TData> {
    table: Table<TData>;
    className?: string;
}

export function QuickFilters<TData>({ table, className }: QuickFiltersProps<TData>) {

    const handleFilterUnpaid = () => {
        const paymentStatusColumn = table.getColumn("paymentStatus");
        if (paymentStatusColumn) {
            // Check if the filter is already active
            const currentFilter = paymentStatusColumn.getFilterValue() as string[] | undefined;
            if (currentFilter && currentFilter.length === 1 && currentFilter[0] === "Неплатено") {
                 // If it is, clear the filter for this column
                paymentStatusColumn.setFilterValue(undefined);
            } else {
                // Otherwise, set the filter
                paymentStatusColumn.setFilterValue(["Неплатено"]);
            }
        }
    };

    const isUnpaidFilterActive = () => {
        const paymentStatusColumn = table.getColumn("paymentStatus");
        if (paymentStatusColumn) {
            const currentFilter = paymentStatusColumn.getFilterValue() as string[] | undefined;
            return currentFilter && currentFilter.length === 1 && currentFilter[0] === "Неплатено";
        }
        return false;
    }

    return (
        <Button
            variant={isUnpaidFilterActive() ? "destructive" : "outline"}
            size="sm"
            className={cn("h-8 border-dashed", className)}
            onClick={handleFilterUnpaid}
        >
            <XCircle className="mr-2 h-4 w-4" />
            Неплатени
        </Button>
    );
}
