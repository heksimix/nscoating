'use client';

import * as React from "react";
import { format, differenceInDays, isValid } from "date-fns";
import { bg } from "date-fns/locale";
import { CheckCircle2, XCircle, FileText } from "lucide-react";
import type { Row } from "@tanstack/react-table";

import { cn } from "@/lib/utils";
import type { Order } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";


const paymentStatusConfig: Record<string, {
  icon: React.ElementType;
  textColor: string;
  bgColor: string;
  borderColor: string;
}> = {
  "Платено": { icon: CheckCircle2, textColor: "text-status-paid", bgColor: "bg-status-paid/10", borderColor: "border-status-paid/20" },
  "Неплатено": { icon: XCircle, textColor: "text-status-unpaid", bgColor: "bg-status-unpaid/10", borderColor: "border-status-unpaid/20" },
  "Няма": { icon: FileText, textColor: "text-muted-foreground", bgColor: "bg-muted", borderColor: "border-border" }
};

const ReasonDialog = ({
    isOpen,
    onOpenChange,
    initialReason,
    onSave,
} : {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialReason: string;
    onSave: (reason: string) => void;
}) => {
    const [reason, setReason] = React.useState(initialReason);

    React.useEffect(() => {
        if (isOpen) {
            setReason(initialReason);
        }
    }, [isOpen, initialReason]);

    const handleSave = () => {
        onSave(reason);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Причина за статус &quot;Няма&quot;</DialogTitle>
                    <DialogDescription>
                        Моля, въведете причина, поради която тази поръчка няма плащане. Полето е задължително.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Напр. Гаранционна подмяна, мостра..."
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
                    <Button onClick={handleSave} disabled={!reason.trim()}>Запази</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export const EditablePaymentInfoCell = ({ row, table }: { row: Row<Order>, table: any }) => {
    const order = row.original;
    const { updateOrder } = table.options.meta;

    const [isReasonDialogOpen, setReasonDialogOpen] = React.useState(false);
    const [isPaymentDateOpen, setIsPaymentDateOpen] = React.useState(false);
    
    const handleSaveReason = (reason: string) => {
        updateOrder({ ...order, paymentStatus: 'Няма', paymentMethod: 'Няма', reason, paymentDate: null });
    };

    const statuses: Order['paymentStatus'][] = ["Платено", "Неплатено", "Няма"];
    const statusInfo = paymentStatusConfig[order.paymentStatus];

    const handleStatusChange = (newStatus: Order['paymentStatus']) => {
        if (newStatus === 'Няма') {
            setTimeout(() => {
                setReasonDialogOpen(true);
            }, 100);
        } else {
            let payload: Partial<Order> = { paymentStatus: newStatus };
            if (order.paymentMethod === 'Няма') {
                payload.paymentMethod = 'В брой';
                payload.reason = null;
            }
            
            if (newStatus === 'Платено' && !order.paymentDate) {
                payload.paymentDate = new Date();
            } else if (newStatus !== 'Платено') {
                payload.paymentDate = null;
            }

            updateOrder({ ...order, ...payload });
        }
    };

    const methods: Order['paymentMethod'][] = ["В брой", "Банков превод", "Няма"];

    const handleMethodChange = (newMethod: Order['paymentMethod']) => {
        if (newMethod === 'Няма') {
            setTimeout(() => {
                setReasonDialogOpen(true);
            }, 100);
        } else {
            let payload: Partial<Order> = { paymentMethod: newMethod };
            if (order.paymentStatus === 'Няма') {
                payload.paymentStatus = 'Неплатено';
                payload.reason = null;
                payload.paymentDate = null;
            }
            updateOrder({ ...order, ...payload });
        }
    };

    const showPaymentMethod = order.paymentMethod !== 'Няма';
    const showReasonText = order.paymentMethod === 'Няма' && order.reason;

    const parseDate = (val: any): Date | undefined => {
        if (!val) return undefined;
        const d = new Date(val);
        return isValid(d) ? d : undefined;
    };

    return (
        <>
            <div className="flex flex-col gap-0.5 items-start">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className={cn(
                            "w-fit justify-start p-0 h-auto font-normal text-left focus:ring-0 focus:ring-offset-0 rounded-full border px-2 py-0.5",
                            statusInfo.bgColor, statusInfo.textColor, statusInfo.borderColor
                        )}>
                            <div className="flex items-center gap-1.5">
                                {statusInfo && React.createElement(statusInfo.icon, { className: "h-3.5 w-3.5" })}
                                <span className="font-medium text-xs">{order.paymentStatus}</span>
                            </div>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        {statuses.map(status => (
                            <DropdownMenuItem 
                                key={status} 
                                onSelect={() => {
                                    handleStatusChange(status);
                                }}
                            >
                                <div className="flex items-center gap-2">
                                   {paymentStatusConfig[status] && React.createElement(paymentStatusConfig[status].icon, { className: cn("h-4 w-4", paymentStatusConfig[status].textColor) })}
                                   <span>{status}</span>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {showPaymentMethod && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" className="w-fit justify-start p-0 h-auto font-normal text-left focus:ring-0 focus:ring-offset-0 text-xs text-muted-foreground pl-1">
                                {order.paymentMethod}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {methods.map(method => (
                                <DropdownMenuItem 
                                    key={method} 
                                    onSelect={() => {
                                        handleMethodChange(method);
                                    }}
                                >
                                    {method}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                 {showReasonText && (
                     <div className="text-xs text-muted-foreground whitespace-normal break-words pl-1" title={order.reason || ""}>{order.reason}</div>
                )}
                {order.paymentStatus === 'Платено' && (
                    <Popover open={isPaymentDateOpen} onOpenChange={setIsPaymentDateOpen}>
                        <PopoverTrigger asChild>
                            <Button
                            variant="ghost"
                            className={cn(
                                "w-fit justify-start p-0 h-auto font-normal text-left focus:ring-0 focus:ring-offset-0 text-xs text-muted-foreground pl-1",
                                !order.paymentDate && "text-destructive"
                            )}
                            >
                            {order.paymentDate ? format(new Date(order.paymentDate), "dd.MM.yyyy") : "Няма дата"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                locale={bg}
                                mode="single"
                                selected={parseDate(order.paymentDate)}
                                onSelect={(date) => {
                                    updateOrder({ ...order, paymentDate: date });
                                    setIsPaymentDateOpen(false);
                                }}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            <ReasonDialog 
                isOpen={isReasonDialogOpen}
                onOpenChange={setReasonDialogOpen}
                initialReason={order.reason || ""}
                onSave={handleSaveReason}
            />
        </>
    );
};


export const EditableTextCell = ({
  getValue,
  row: { original: order },
  column: { id },
  table,
  itemIndex,
}: {
  getValue: () => any;
  row: Row<Order>;
  column: { id: string };
  table: any;
  itemIndex?: number;
}) => {
  const initialValue = getValue();
  const isNumeric = id === 'quantity' || id === 'priceWithoutVAT';
  const isPrice = id === 'priceWithoutVAT';
  
  const formatForDisplay = React.useCallback((val: any) => {
    if (val === null || val === undefined || val === "") return "";
    if (isPrice && typeof val === 'number') {
        return val.toFixed(2).replace('.', ',');
    }
    return val.toString().replace('.', ',');
  }, [isPrice]);

  const [value, setValue] = React.useState(formatForDisplay(initialValue));
  const { updateOrder } = table.options.meta;
  
  const isConfirmable = isNumeric;
  const [isConfirmOpen, setConfirmOpen] = React.useState(false);
  const savedRef = React.useRef(false);

  React.useEffect(() => {
    setValue(formatForDisplay(initialValue));
  }, [initialValue, formatForDisplay]);

  const handleSave = () => {
    const cleanedValue = value.replace(',', '.');
    const numInitial = typeof initialValue === 'number' ? initialValue : parseFloat(initialValue);
    const numCurrent = parseFloat(cleanedValue);

    if (!isNaN(numInitial) && !isNaN(numCurrent) && Math.abs(numInitial - numCurrent) < 0.00001 && value === formatForDisplay(initialValue)) {
      setConfirmOpen(false);
      return;
    }

    let finalValue: any = value;
    if (isNumeric) {
        finalValue = parseFloat(cleanedValue);
        if (isNaN(finalValue)) finalValue = 0;
    }

    if (itemIndex !== undefined) {
      const newItems = order.items.map((item, index) => 
        index === itemIndex ? { ...item, [id]: finalValue } : item
      );
      updateOrder({ ...order, items: newItems });
    } else {
      updateOrder({ ...order, [id]: finalValue });
    }

    savedRef.current = true;
    setConfirmOpen(false);
  };

  const onBlur = () => {
    if (isConfirmable) {
      const cleanedValue = value.replace(',', '.');
      const numInitial = typeof initialValue === 'number' ? initialValue : parseFloat(initialValue);
      const numCurrent = parseFloat(cleanedValue);

      if ((isNaN(numInitial) || Math.abs(numInitial - numCurrent) > 0.00001) && value !== "") {
        if (!isNaN(numCurrent)) {
            setValue(formatForDisplay(numCurrent));
        }
        setConfirmOpen(true);
      } else if (value === "") {
        setValue(formatForDisplay(initialValue));
      }
    } else {
      handleSave();
    }
  };

  const handleCancel = () => {
    setValue(formatForDisplay(initialValue));
    setConfirmOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !savedRef.current) {
        handleCancel();
    }
    setConfirmOpen(open);
    if(open) {
        savedRef.current = false;
    }
  };
  
  const alignmentClass = id === 'quantity' ? 'text-center' : id === 'priceWithoutVAT' ? 'text-right' : '';
  const showPlaceholder = id === 'detailType' || id === 'quantity' || id === 'priceWithoutVAT';

  return (
    <>
      <div className="flex flex-col justify-center w-full min-h-10">
        <div className="relative flex items-center">
            <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onBlur={onBlur}
                type="text"
                inputMode={isNumeric ? "decimal" : "text"}
                className={cn(
                    "w-full border-none bg-transparent p-0 focus-visible:ring-1 focus-visible:ring-ring h-auto",
                    alignmentClass,
                    isPrice && "pr-4"
                )}
            />
            {isPrice && (
                <span className="absolute right-0 text-muted-foreground pointer-events-none text-xs">€</span>
            )}
        </div>
        {showPlaceholder && <div className="text-xs leading-tight mt-0.5">&nbsp;</div>}
      </div>
      {isConfirmable && (
        <AlertDialog open={isConfirmOpen} onOpenChange={handleOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Потвърди промяната</AlertDialogTitle>
              <AlertDialogDescription>
                Искате ли да запазите направената промяна?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancel}>Отказ</AlertDialogCancel>
              <AlertDialogAction onClick={handleSave}>Запази</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};


export const EditableDateCell = ({
  getValue,
  row: { original: order },
  column: { id },
  table,
  itemIndex,
}: {
  getValue: () => any;
  row: Row<Order>;
  column: { id: string };
  table: any;
  itemIndex?: number;
}) => {
  const initialValue = getValue();
  const [isOpen, setIsOpen] = React.useState(false);
  const { updateOrder } = table.options.meta;

  const parseDate = (val: any): Date | undefined => {
    if (!val) return undefined;
    const d = new Date(val);
    return isValid(d) ? d : undefined;
  };

  const handleSelect = (selectedDate: Date | undefined) => {
    setIsOpen(false);
    if (itemIndex !== undefined && id === 'returnDate') {
        const newItems = order.items.map((item, index) => 
            index === itemIndex ? { ...item, [id]: selectedDate } : item
        );
        updateOrder({ ...order, items: newItems });
    } else if (id === 'receivedDate') {
        const payload: Partial<Order> = { receivedDate: selectedDate };
        const newItems = order.items.map(item => {
            if (selectedDate && item.returnDate && new Date(item.returnDate) < selectedDate) {
                return { ...item, returnDate: undefined };
            }
            return item;
        });
        payload.items = newItems;
        updateOrder({ ...order, ...payload });
    }
  };
  
  const date = parseDate(initialValue);
  const disabledDays = id === 'returnDate' 
    ? { before: new Date(order.receivedDate) } 
    : undefined;

  let processingDays: number | null = null;
    if (id === 'returnDate' && itemIndex !== undefined) {
    const itemReturnDate = order.items[itemIndex]?.returnDate;
    if (itemReturnDate && order.receivedDate) {
        const d1 = new Date(itemReturnDate);
        const d2 = new Date(order.receivedDate);
        if (isValid(d1) && isValid(d2)) {
            processingDays = differenceInDays(d1, d2);
        }
    }
  }
  
  const dayLabel = (days: number | null) => {
    if (days === null || days < 0) return null;
    if (days === 1) return "1 ден";
    return `${days} дни`;
  }
  
  const label = dayLabel(processingDays);

  return (
    <div className="min-h-10 flex flex-col justify-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"ghost"}
            className={cn(
              "w-full justify-start text-left font-normal h-auto p-0",
              !date && "text-muted-foreground"
            )}
          >
            {date ? format(date, "dd/MM/yy") : "-"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={bg}
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={disabledDays}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <div className="text-xs leading-tight text-muted-foreground mt-0.5">
        {label || <span>&nbsp;</span>}
      </div>
    </div>
  );
};

export const EditableOrderNumberCell = ({
  row,
  table,
}: {
  row: Row<Order>;
  table: any;
}) => {
  const order = row.original;
  const initialValue = order.orderNumber;
  const [value, setValue] = React.useState(initialValue);
  const { updateOrder } = table.options.meta;
  const { toast } = useToast();
  const allOrders = table.options.data as Order[];

  const [isConfirmOpen, setConfirmOpen] = React.useState(false);
  const savedRef = React.useRef(false);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = () => {
    const trimmedValue = value.trim();
    if (trimmedValue === initialValue) {
      setConfirmOpen(false);
      return;
    }

    if (trimmedValue === "") {
        setValue(initialValue);
        setConfirmOpen(false);
        return;
    }

    const duplicate = allOrders.find(o => o.orderNumber === trimmedValue && o.id !== order.id);
    if (duplicate) {
      toast({
        title: "Грешка!",
        description: `Поръчка с номер ${trimmedValue} вече съществува (Клиент: ${duplicate.client}).`,
        variant: "destructive",
      });
      setValue(initialValue);
      setConfirmOpen(false);
      return;
    }

    updateOrder({ ...order, orderNumber: trimmedValue });
    savedRef.current = true;
    setConfirmOpen(false);
  };

  const onBlur = () => {
    if (value.trim() !== initialValue && value.trim() !== "") {
      setConfirmOpen(true);
    } else {
      setValue(initialValue);
    }
  };

  const handleCancel = () => {
    setValue(initialValue);
    setConfirmOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !savedRef.current) {
        handleCancel();
    }
    setConfirmOpen(open);
    if (open) savedRef.current = false;
  };

  return (
    <>
      <div className="flex items-center gap-0.5 min-h-10">
        <span className="text-muted-foreground text-xs font-normal mt-0.5">#</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          className="w-full border-none bg-transparent p-0 focus-visible:ring-1 focus-visible:ring-ring h-auto font-medium outline-none"
        />
      </div>
      <AlertDialog open={isConfirmOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Потвърди промяната</AlertDialogTitle>
            <AlertDialogDescription>
              Искате ли да промените номера на поръчката от #{initialValue} на #{value}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Отказ</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Запази</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
