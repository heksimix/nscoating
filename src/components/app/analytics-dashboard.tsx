
"use client";

import * as React from "react";
import { 
  Bar, BarChart, Line, LineChart, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import { 
  TrendingUp, TrendingDown, Wallet, Calendar, Percent, ShoppingBag, 
  PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Order, FixedExpense, MonthlyExpense, VariableExpense, MonthlyIncome } from "@/lib/schemas";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, startOfYear } from "date-fns";
import { bg } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface AnalyticsDashboardProps {
  orders: Order[];
  fixedExpenses: FixedExpense[];
  monthlyExpenses: MonthlyExpense[];
  variableExpenses: VariableExpense[];
  monthlyIncomes: MonthlyIncome[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amount);
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function AnalyticsDashboard({ 
  orders, 
  fixedExpenses, 
  monthlyExpenses, 
  variableExpenses, 
  monthlyIncomes 
}: AnalyticsDashboardProps) {
  const [period, setPeriod] = React.useState<string>("6");

  const stats = React.useMemo(() => {
    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const numMonths = period === "this_year" ? new Date().getMonth() + 1 : parseInt(period);
    
    // 1. Генерираме всички месеци за периода, но филтрираме само от 2026 нагоре
    const months = Array.from({ length: numMonths }, (_, i) => {
      const date = subMonths(new Date(), i);
      return format(date, 'yyyy-MM');
    }).reverse()
    .filter(m => m >= "2026-01");

    // 2. Месеци за изчисляване на СРЕДНИ стойности (само ПРИКЛЮЧИЛИ месеци преди текущия)
    const completedMonths = months.filter(m => m < currentMonthKey);
    
    // Ако сме в началото на годината и няма приключили месеци, използваме наличните от 2026
    const statsMonthsForAverage = completedMonths.length > 0 ? completedMonths : months;

    let totalIncAll = 0;
    let totalExpAll = 0;
    
    // Подготовка за разпределение на разходите (за всички месеци в изгледа)
    let totalFixedAll = 0;
    let totalVarWithInvAll = 0;
    let totalVarNoInvAll = 0;
    let totalTaxAll = 0;

    const monthlyStats = months.map(monthKey => {
      const date = new Date(monthKey + "-01");
      const monthName = format(date, "LLL", { locale: bg });

      const income = monthlyIncomes.find(i => i.month === monthKey);
      const totalIncome = (income?.bank || 0) + (income?.cash || 0);

      const monthlyFixedSum = fixedExpenses.reduce((sum, expense) => {
        const isRecurring = expense.isRecurring !== false;
        const wasCreated = !expense.creationMonth || expense.creationMonth <= monthKey;
        const isMatchingMonth = expense.creationMonth === monthKey;
        if (isRecurring ? wasCreated : isMatchingMonth) {
          return sum + (monthlyExpenses.find(me => me.expenseId === expense.id && me.month === monthKey)?.amount || 0);
        }
        return sum;
      }, 0);

      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthVars = variableExpenses.filter(exp => isWithinInterval(new Date(exp.date), { start: monthStart, end: monthEnd }));
      const varWithInvoice = monthVars.filter(e => e.hasInvoice).reduce((sum, e) => sum + e.amount, 0);
      const varWithoutInvoice = monthVars.filter(e => !e.hasInvoice).reduce((sum, e) => sum + e.amount, 0);
      const varTax = varWithoutInvoice * 0.1;

      const totalExpenses = monthlyFixedSum + varWithInvoice + varWithoutInvoice + varTax;
      const profit = totalIncome - totalExpenses;

      // Ако месецът е в базата за средни стойности, добавяме го към общите суми
      if (statsMonthsForAverage.includes(monthKey)) {
          totalIncAll += totalIncome;
          totalExpAll += totalExpenses;
          
          totalFixedAll += monthlyFixedSum;
          totalVarWithInvAll += varWithInvoice;
          totalVarNoInvAll += varWithoutInvoice;
          totalTaxAll += varTax;
      }

      let ordersTurnover = 0;
      let orderCount = 0;
      orders.forEach(order => {
        if (format(new Date(order.receivedDate), 'yyyy-MM') === monthKey) orderCount++;
        if (order.paymentStatus === 'Платено' && order.paymentDate) {
          if (format(new Date(order.paymentDate), 'yyyy-MM') === monthKey) {
            ordersTurnover += order.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.priceWithoutVAT || 0), 0);
          }
        }
      });

      return {
        monthKey,
        monthName,
        income: totalIncome,
        expenses: totalExpenses,
        profit,
        ordersTurnover,
        orderCount
      };
    });

    const divisor = statsMonthsForAverage.length || 1;
    const avgIncome = totalIncAll / divisor;
    const avgExpenses = totalExpAll / divisor;
    const avgProfit = avgIncome - avgExpenses;

    const totalPeriodTurnover = monthlyStats.reduce((acc, curr) => acc + curr.ordersTurnover, 0);
    const totalPeriodOrderCount = monthlyStats.reduce((acc, curr) => acc + curr.orderCount, 0);
    const avgOrderValue = totalPeriodOrderCount > 0 ? totalPeriodTurnover / totalPeriodOrderCount : 0;
    const avgMargin = avgIncome > 0 ? (avgProfit / avgIncome) * 100 : 0;

    const expenseDistribution = [
      { name: "Постоянни", value: totalFixedAll },
      { name: "С фактура", value: totalVarWithInvAll },
      { name: "Без фактура", value: totalVarNoInvAll },
      { name: "Данъци (10%)", value: totalTaxAll },
    ].filter(d => d.value > 0);

    return {
      monthlyStats,
      avgIncome,
      avgExpenses,
      avgProfit,
      avgMargin,
      avgOrderValue,
      activeMonthsCount: divisor,
      expenseDistribution
    };
  }, [orders, fixedExpenses, monthlyExpenses, variableExpenses, monthlyIncomes, period]);

  const topClients = React.useMemo(() => {
    const numMonths = period === "this_year" ? new Date().getMonth() + 1 : parseInt(period);
    const startDate = subMonths(new Date(), numMonths - 1);
    startDate.setDate(1);
    startDate.setHours(0,0,0,0);

    const turnoverByClient: { [key: string]: number } = {};
    orders.forEach(order => {
      if (order.paymentStatus === 'Платено' && order.paymentDate) {
          const paymentDate = new Date(order.paymentDate);
          if (paymentDate >= startDate && paymentDate.getFullYear() >= 2026) {
            const orderTotal = order.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.priceWithoutVAT || 0), 0);
            turnoverByClient[order.client] = (turnoverByClient[order.client] || 0) + orderTotal;
          }
      }
    });
    return Object.entries(turnoverByClient)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, turnover]) => ({ name, turnover }));
  }, [orders, period]);

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-card p-4 rounded-lg border shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <Label htmlFor="period-select" className="text-sm font-medium">Период за анализ (от 2026 г.):</Label>
            </div>
            <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period-select" className="w-full sm:w-[220px] h-9">
                    <SelectValue placeholder="Изберете период" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="3">Последните 3 месеца</SelectItem>
                    <SelectItem value="6">Последните 6 месеца</SelectItem>
                    <SelectItem value="12">Последните 12 месеца</SelectItem>
                    <SelectItem value="24">Последните 24 месеца</SelectItem>
                    <SelectItem value="this_year">Тази година (от януари)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ср. месечен оборот</CardTitle>
                    <TrendingUp className="h-4 w-4 text-status-paid" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(stats.avgIncome)}</div>
                    <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(stats.avgIncome * 1.2)}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold">База: {stats.activeMonthsCount} приключили месеца</p>
                </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ср. месечни разходи</CardTitle>
                    <TrendingDown className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-destructive">{formatCurrency(stats.avgExpenses)}</div>
                    <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(stats.avgExpenses * 1.2)}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold">База: {stats.activeMonthsCount} приключили месеца</p>
                </CardContent>
            </Card>
            <Card className={stats.avgProfit >= 0 ? "bg-status-paid/5 border-status-paid/20" : "bg-status-unpaid/5 border-status-unpaid/20"}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ср. месечна печалба</CardTitle>
                    <Wallet className={stats.avgProfit >= 0 ? "h-4 w-4 text-status-paid" : "h-4 w-4 text-status-unpaid"} />
                </CardHeader>
                <CardContent>
                    <div className={`text-2xl font-bold ${stats.avgProfit >= 0 ? "text-status-paid" : "text-status-unpaid"}`}>
                        {formatCurrency(stats.avgProfit)}
                    </div>
                    <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(stats.avgProfit * 1.2)}</p>
                    <p className="text-[10px] text-muted-foreground mt-2 uppercase font-bold">База: {stats.activeMonthsCount} приключили месеца</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Рентабилност (Марж)</CardTitle>
                    <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.avgMargin.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">чиста печалба от всяко евро оборот (ср. стойност)</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ср. стойност на поръчка</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(stats.avgOrderValue)}</div>
                    <p className="text-xs text-muted-foreground">с ДДС: {formatCurrency(stats.avgOrderValue * 1.2)}</p>
                </CardContent>
            </Card>
        </div>

        <div className="grid gap-4 md:gap-8 grid-cols-1 lg:grid-cols-2">
            <Card>
                <CardHeader>
                <CardTitle>Месечен оборот (без ДДС)</CardTitle>
                <CardDescription>Обща сума на платените поръчки по месеци от 2026 г.</CardDescription>
                </CardHeader>
                <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="monthName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} €`} />
                    <Tooltip 
                        formatter={(value) => formatCurrency(value as number)}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Bar name="Оборот" dataKey="ordersTurnover" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                <CardTitle>Нови поръчки (брой)</CardTitle>
                <CardDescription>Брой на създадените поръчки по месеци.</CardDescription>
                </CardHeader>
                <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={stats.monthlyStats}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="monthName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                        formatter={(value, name) => [value, name]}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                    <Legend />
                    <Line name="Брой поръчки" type="monotone" dataKey="orderCount" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Финансов тренд</CardTitle>
                    <CardDescription>Сравнение на общите приходи и разходи (от 2026 г.).</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.monthlyStats}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="monthName" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value} €`} />
                            <Tooltip 
                                formatter={(value) => formatCurrency(value as number)}
                                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <Legend />
                            <Line name="Приходи" type="monotone" dataKey="income" stroke="hsl(var(--status-paid))" strokeWidth={3} dot={{ r: 4 }} />
                            <Line name="Разходи" type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle>Разпределение на разходите</CardTitle>
                    </div>
                    <CardDescription>Структура на разходите (базирана само на приключили месеци).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.expenseDistribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.expenseDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Топ 5 Клиенти (без ДДС)</CardTitle>
                    <CardDescription>Клиенти с най-голям оборот от платени поръчки през 2026 г.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {topClients.map((client, index) => (
                            <li key={client.name} className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 min-w-0">
                                    <span className="text-base sm:text-lg font-bold text-muted-foreground leading-tight pt-0.5">{index + 1}</span>
                                    <p className="text-sm sm:text-base font-medium break-words">{client.name}</p>
                                </div>
                                <p className="text-sm sm:text-base font-semibold text-right shrink-0">{formatCurrency(client.turnover)}</p>
                            </li>
                        ))}
                        {topClients.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">Няма данни за платени поръчки през 2026 г.</p>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
