"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay, endOfWeek, startOfWeek } from "date-fns"
import { bg } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "./separator"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  onDateChange: (date: DateRange | undefined) => void
}

export function DateRangePicker({
  className,
  date,
  onDateChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date);

  React.useEffect(() => {
    if (isOpen) {
      setTempDate(date);
    }
  }, [isOpen, date]);


  type Preset = {
    label: string
    range?: DateRange
  }
  
  const presets: Preset[] = [
    { label: "Днес", range: { from: startOfDay(new Date()), to: endOfDay(new Date()) } },
    { label: "Тази седмица", range: { from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) } },
    { label: "Този месец", range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) } },
    { label: "Тази година", range: { from: startOfYear(new Date()), to: endOfYear(new Date()) } },
    { label: "Всички", range: undefined },
  ]

  const allTimePreset = presets.find(p => p.label === "Всички");
  const otherPresets = presets.filter(p => p.label !== "Всички");

  const handlePresetClick = (preset: Preset) => {
    onDateChange(preset.range)
    setIsOpen(false)
  }

  const handleApply = () => {
    onDateChange(tempDate);
    setIsOpen(false);
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full md:w-[280px] justify-start text-left font-normal h-8 border-dashed",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd.MM.y", { locale: bg })} -{" "}
                  {format(date.to, "dd.MM.y", { locale: bg })}
                </>
              ) : (
                format(date.from, "dd.MM.y", { locale: bg })
              )
            ) : (
              <span>Избери период</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col sm:flex-row shadow-2xl border-border overflow-hidden" align="start">
          <div className="flex flex-col space-y-1 p-3 bg-muted/30 border-b sm:border-r sm:border-b-0 min-w-[140px]">
            <p className="text-[10px] font-bold text-muted-foreground px-2 py-1 uppercase tracking-widest mb-1 opacity-70">Бърз избор</p>
            {otherPresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                className="justify-start h-8 w-full text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
            {allTimePreset && (
              <>
                <Separator className="my-2" />
                <Button
                  key={allTimePreset.label}
                  variant="ghost"
                  className="justify-start h-8 w-full text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => handlePresetClick(allTimePreset)}
                >
                  {allTimePreset.label}
                </Button>
              </>
            )}
          </div>
          <div className="flex flex-col">
            <div className="p-1">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={tempDate?.from}
                selected={tempDate}
                onSelect={setTempDate}
                locale={bg}
                numberOfMonths={2}
              />
            </div>
            <div className="flex items-center justify-end gap-2 p-3 border-t">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Отказ</Button>
              <Button onClick={handleApply}>Приложи</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
