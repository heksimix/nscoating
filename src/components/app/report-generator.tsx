"use client";

import * as React from "react";
import { Loader2, Banknote, CreditCard, AlertCircle, ArrowRightCircle, Briefcase } from "lucide-react";
import type { Order } from "@/lib/schemas";
import { generateLocalReport, LocalReportOutput } from "@/lib/report-utils";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, isValid } from "date-fns";
import { bg } from "date-fns/locale";
import { Separator } from "@/components/ui/separator";
import NextLink from "next/link";
import { SidebarTrigger } from "../ui/sidebar";
import { DateRangePicker } from "../ui/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ReportGeneratorProps = {
  orders: Order[];
};

const paymentStatusClasses: Record<string, string> = {
    "Платено": "bg-status-paid/10 text-status-paid border-status-paid/20",
    "Неплатено": "bg-status-unpaid/10 text-status-unpaid border-status-unpaid/20",
    "Няма": "bg-muted text-muted-foreground border-border"
};

export default function ReportGenerator({ orders }: ReportGeneratorProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [report, setReport] = React.useState<LocalReportOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateReport = React.useCallback(() => {
    setIsLoading(true);
    try {
      // Ако няма избран диапазон (from е undefined), подаваме undefined на функцията
      const interval = (dateRange && dateRange.from)
        ? { start: dateRange.from, end: dateRange.to || dateRange.from }
        : undefined;
        
      const result = generateLocalReport(orders, interval);
      setReport(result);
    } catch (error) {
      console.error("Неуспешно генериране на отчет:", error);
      toast({
        variant: "destructive",
        title: "Грешка при генериране на отчет",
        description: "Възникна грешка при генерирането на отчета. Моля, опитайте отново.",
      });
      setReport(null);
    } finally {
      setIsLoading(false);
    }
  }, [orders, dateRange, toast]);

  React.useEffect(() => {
    handleGenerateReport();
  }, [handleGenerateReport]);
  
  const formatCurrency = (amount: number) => {
     return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amount)
  }

  const formatDateSafe = (date: any, formatStr: string = "dd.MM.yyyy") => {
    if (!date) return "-";
    const d = new Date(date);
    if (!isValid(d)) return "-";
    return format(d, formatStr, { locale: bg });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Справка обороти</CardTitle>
            <SidebarTrigger className="md:hidden" />
        </div>
        <CardDescription>
        Генерирайте справка за общата стойност от поръчките, приходите и неплатените задължения за избран период.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
            <Label htmlFor="date">Период от време</Label>
            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
        </div>
        
        {isLoading && <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}

        {!isLoading && report && (
          <div className="space-y-6">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Обща стойност (без ДДС)</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(report.totalValueForPeriod)}</div>
                        <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.totalValueForPeriod * 1.2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">от {report.orders.length} поръчки за периода</p>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground flex items-center gap-1.5 pt-1"><CreditCard className="h-4 w-4" />По банков път</span>
                                <div className="text-right">
                                    <div className="font-medium">{formatCurrency(report.totalValueByBank)}</div>
                                    <div className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.totalValueByBank * 1.2)}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground flex items-center gap-1.5 pt-1"><Banknote className="h-4 w-4" />В брой</span>
                                <div className="text-right">
                                    <div className="font-medium">{formatCurrency(report.totalValueByCash)}</div>
                                    <div className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.totalValueByCash * 1.2)}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Приходи (без ДДС)</CardTitle>
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(report.totalTurnover)}</div>
                        <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.totalTurnover * 1.2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">от платени поръчки за периода</p>
                        <Separator className="my-3" />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground flex items-center gap-1.5 pt-1"><CreditCard className="h-4 w-4" />По банков път</span>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(report.bankTransferTurnover)}</div>
                                  <div className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.bankTransferTurnover * 1.2)}</div>
                                </div>
                            </div>
                            <div className="flex justify-between items-start">
                                <span className="text-muted-foreground flex items-center gap-1.5 pt-1"><Banknote className="h-4 w-4" />В брой</span>
                                <div className="text-right">
                                  <div className="font-medium">{formatCurrency(report.cashTurnover)}</div>
                                  <div className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.cashTurnover * 1.2)}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Неплатени (без ДДС)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-status-unpaid" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-status-unpaid">{formatCurrency(report.unpaidForPeriod)}</div>
                        <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.unpaidForPeriod * 1.2)}</p>
                        <p className="text-xs text-muted-foreground mt-1">създадени в периода</p>
                        <Separator className="my-3" />
                        <NextLink href="/?filter=unpaid" className="block transition-colors hover:bg-muted/50 p-2 -m-2 rounded-lg">
                            <div className="text-lg font-bold text-status-unpaid/90">{formatCurrency(report.totalUnpaid)}</div>
                             <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(report.totalUnpaid * 1.2)}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Общо от всички неплатени поръчки</p>
                        </NextLink>
                    </CardContent>
                </Card>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">Поръчки за периода</h3>
              {/* Mobile/Tablet Card View */}
              <div className="grid gap-4 md:grid-cols-2 lg:hidden">
                {report.orders.length > 0 ? (
                  report.orders.map((order, index) => (
                    <Card key={`${order.id}-${index}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                                <CardTitle className="text-base font-bold break-words">
                                    <NextLink href={`/?order=${order.id}`} className="hover:underline">
                                        #{order.orderNumber}
                                    </NextLink>
                                </CardTitle>
                                <CardDescription className="break-words">{order.client}</CardDescription>
                            </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <Separator />
                        <div className="flex justify-between font-semibold">
                          <span>Сума (без ДДС)</span>
                          <span>{formatCurrency(order.totalWithoutVAT)}</span>
                        </div>
                         <div className="flex justify-between font-bold">
                          <span>Сума (с ДДС)</span>
                          <span>{formatCurrency(order.totalWithoutVAT * 1.2)}</span>
                        </div>
                        <Separator />
                         <div className="text-xs space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground flex items-center gap-1.5"><ArrowRightCircle className="h-3.5 w-3.5" />Получена:</span>
                                <span className="font-medium">{formatDateSafe(order.receivedDate)}</span>
                            </div>
                         </div>
                         <Separator />
                         <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Статус:</span>
                                <Badge variant="outline" className={cn("text-xs", paymentStatusClasses[order.paymentStatus])}>
                                    {order.paymentStatus}
                                </Badge>
                            </div>
                            {order.paymentStatus === 'Платено' && order.paymentDate && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Платена на:</span>
                                    <span className="font-medium">{formatDateSafe(order.paymentDate)}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Плащане:</span>
                                <span className="font-medium">{order.paymentMethod}</span>
                            </div>
                         </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 text-muted-foreground">Няма поръчки за избрания период.</div>
                )}
              </div>

              {/* Desktop Table View */}
               <div className="hidden lg:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>№</TableHead>
                      <TableHead>Клиент</TableHead>
                      <TableHead>Дата на поръчката</TableHead>
                      <TableHead>Начин на плащане</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="text-right">Сума (без ДДС)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.orders.length > 0 ? (
                      report.orders.map((order, index) => (
                        <TableRow key={`${order.id}-${index}`}>
                          <TableCell className="font-medium">
                            <NextLink href={`/?order=${order.id}`} className="hover:underline">
                                #{order.orderNumber}
                            </NextLink>
                          </TableCell>
                          <TableCell>{order.client}</TableCell>
                          <TableCell>
                            <div className="text-xs flex flex-col gap-1">
                                <div className="flex items-center gap-1.5">
                                    <ArrowRightCircle className="h-3 w-3 text-status-paid" />
                                    <span>{formatDateSafe(order.receivedDate)}</span>
                                </div>
                            </div>
                          </TableCell>
                          <TableCell>{order.paymentMethod}</TableCell>
                           <TableCell>
                                <Badge variant="outline" className={cn("text-xs", paymentStatusClasses[order.paymentStatus])}>
                                    {order.paymentStatus}
                                </Badge>
                                {order.paymentStatus === 'Платено' && order.paymentDate && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {formatDateSafe(order.paymentDate)}
                                    </div>
                                )}
                           </TableCell>
                          <TableCell className="text-right font-medium">
                            <div>{formatCurrency(order.totalWithoutVAT)}</div>
                            <div className="text-xs text-muted-foreground font-normal">
                                с ДДС: {formatCurrency(order.totalWithoutVAT * 1.2)}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          Няма поръчки за избрания период.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
