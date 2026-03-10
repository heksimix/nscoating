"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import NextLink from "next/link";
import { useAppData } from "@/hooks/use-app-data";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/app-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Briefcase,
  Banknote,
  AlertCircle,
  FileText,
  MapPin,
  Building,
  MoreHorizontal,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, isWithinInterval } from "date-fns";
import { bg } from "date-fns/locale";
import type { Order, Client } from "@/lib/schemas";
import { AddClientForm } from "@/components/app/add-client-form";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";
import { useUser } from "@/firebase/auth/use-user";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusClasses: Record<string, string> = {
    "Платено": "bg-status-paid/10 text-status-paid border-status-paid/20",
    "Неплатено": "bg-status-unpaid/10 text-status-unpaid border-status-unpaid/20",
    "Няма": "bg-muted text-muted-foreground border-border"
};

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { clients, orders, isDataLoaded, deleteClient, updateClient } = useAppData();
    const clientId = params.id as string;
    const { user, isLoading: isUserLoading } = useUser();

    const [client, setClient] = React.useState<Client | null>(null);
    const [allClientOrders, setAllClientOrders] = React.useState<Order[]>([]);
    const [clientOrders, setClientOrders] = React.useState<Order[]>([]);
    const [stats, setStats] = React.useState({ totalTurnover: 0, paidAmount: 0, unpaidAmount: 0, orderCount: 0 });
    const [isEditing, setIsEditing] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined);
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'Платено' | 'Неплатено'>('all');

    React.useEffect(() => {
        if (!isUserLoading && !user) {
        router.push('/login');
        }
    }, [user, isUserLoading, router]);

    React.useEffect(() => {
        if (isDataLoaded && clientId) {
            const foundClient = clients.find(c => c.id === clientId);
            if (foundClient) {
                setClient(foundClient);

                const ordersForClient = orders.filter(o => o.client.toLowerCase() === foundClient.name.toLowerCase())
                    .sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime());
                setAllClientOrders(ordersForClient);
            } else {
                router.push('/clients');
            }
        }
    }, [clientId, clients, orders, isDataLoaded, router]);

    React.useEffect(() => {
        const ordersToProcess = allClientOrders
            .filter(order => {
                // Date filter logic
                if (!dateRange || !dateRange.from) {
                    return true;
                }
                const from = new Date(dateRange.from!);
                from.setHours(0, 0, 0, 0);
                const to = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from!);
                to.setHours(23, 59, 59, 999);
                const receivedDate = new Date(order.receivedDate);
                const isReceivedInRange = receivedDate >= from && receivedDate <= to;
                const isReturnInRange = order.items.some(item => 
                    item.returnDate && isWithinInterval(new Date(item.returnDate), { start: from, end: to })
                );
                return isReceivedInRange || isReturnInRange;
            })
            .filter(order => {
                // Status filter logic
                if (statusFilter === 'all') {
                    return true;
                }
                return order.paymentStatus === statusFilter;
            });
        
        setClientOrders(ordersToProcess);

        const totalTurnover = ordersToProcess.reduce((acc, o) => acc + o.totalWithoutVAT, 0);

        const paidAmount = ordersToProcess
            .filter(o => o.paymentStatus === 'Платено')
            .reduce((acc, o) => acc + o.totalWithoutVAT, 0);

        const unpaidAmount = ordersToProcess
            .filter(o => o.paymentStatus === 'Неплатено')
            .reduce((acc, o) => acc + o.totalWithoutVAT, 0);

        setStats({
            totalTurnover,
            paidAmount,
            unpaidAmount,
            orderCount: ordersToProcess.length,
        });
    }, [allClientOrders, dateRange, statusFilter]);


    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR" }).format(amount);
    };

    const handleDelete = () => {
        deleteClient(clientId);
        router.push('/clients');
    };

    const handleUpdate = (updatedClientData: Omit<Client, 'id'>) => {
        if (client) {
            updateClient({ ...updatedClientData, id: client.id });
        }
        setIsEditing(false);
    };

    if (isUserLoading || !user || !isDataLoaded || !client) {
        return (
            <SidebarProvider>
                <AppSidebar pathname="/clients" />
                <SidebarInset>
                    <main className="flex flex-1 items-center justify-center p-4">
                        <div>Зареждане...</div>
                    </main>
                </SidebarInset>
            </SidebarProvider>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar pathname="/clients" />
            <SidebarInset>
                <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => router.back()}>
                                <ArrowLeft className="h-4 w-4" />
                                <span className="sr-only">Назад</span>
                            </Button>
                            <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                                {client.name}
                            </h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Редактирай
                                </Button>
                                <Button variant="destructive" size="sm" onClick={() => setIsDeleting(true)}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Изтрий
                                </Button>
                            </div>
                            <div className="sm:hidden">
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Отвори меню с действия</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Редактирай
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setIsDeleting(true)} className="text-destructive focus:text-destructive/90">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Изтрий
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <SidebarTrigger className="md:hidden" />
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
                            <Label htmlFor="date-range" className="shrink-0 text-muted-foreground flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4" />
                                Период от време
                            </Label>
                            <DateRangePicker date={dateRange} onDateChange={setDateRange} />
                        </div>
                        <Tabs defaultValue="all" onValueChange={(value) => setStatusFilter(value as any)}>
                            <TabsList className="grid w-full grid-cols-3 md:w-auto">
                                <TabsTrigger value="all">Всички</TabsTrigger>
                                <TabsTrigger value="Платено">Платени</TabsTrigger>
                                <TabsTrigger value="Неплатено">Неплатени</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>


                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Общ оборот</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats.totalTurnover)}</div>
                                <p className="text-xs text-muted-foreground">от {stats.orderCount} поръчки за периода</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Платени</CardTitle>
                                <Banknote className="h-4 w-4 text-status-paid" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-status-paid">{formatCurrency(stats.paidAmount)}</div>
                                <p className="text-xs text-muted-foreground">от платени поръчки</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Неплатени</CardTitle>
                                <AlertCircle className="h-4 w-4 text-status-unpaid" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-status-unpaid">{formatCurrency(stats.unpaidAmount)}</div>
                                <p className="text-xs text-muted-foreground">от неплатени поръчки</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Фирмени данни</CardTitle>
                                <Building className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="text-sm pt-2 space-y-1">
                                {client.address && <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground"/> {client.address}</p>}
                                {client.eik && <p className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground"/> ЕИК: {client.eik}</p>}
                                {(!client.address && !client.eik) && <p className="text-muted-foreground">Няма данни</p>}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-5">
                            <CardHeader>
                                <CardTitle>История на поръчките</CardTitle>
                            </CardHeader>
                            <CardContent className="px-2 sm:px-6">
                                {/* Desktop View Table */}
                                <div className="hidden sm:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>№</TableHead>
                                                <TableHead>Дата</TableHead>
                                                <TableHead>Детайли</TableHead>
                                                <TableHead>Статус</TableHead>
                                                <TableHead className="text-right">Сума</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {clientOrders.length > 0 ? clientOrders.map(order => (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">
                                                        <NextLink href={`/?order=${order.id}`} className="hover:underline">
                                                            #{order.orderNumber}
                                                        </NextLink>
                                                    </TableCell>
                                                    <TableCell>{format(new Date(order.receivedDate), "dd.MM.yyyy")}</TableCell>
                                                    <TableCell>
                                                        {order.items.map(item => item.detailType).join(', ')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn("text-xs font-medium", statusClasses[order.paymentStatus])}>
                                                            {order.paymentStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatCurrency(order.totalWithoutVAT)}</TableCell>
                                                </TableRow>
                                            )) : (
                                                <TableRow>
                                                    <TableCell colSpan={5} className="h-24 text-center">Няма намерени поръчки{dateRange?.from || statusFilter !== 'all' ? ' за избраните филтри' : ''}.</TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile View Cards */}
                                <div className="grid gap-4 sm:hidden">
                                    {clientOrders.length > 0 ? clientOrders.map(order => (
                                        <Card key={order.id} className="bg-muted/30 shadow-none border">
                                            <CardHeader className="p-4 pb-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <NextLink href={`/?order=${order.id}`} className="font-bold text-base hover:underline block">
                                                            #{order.orderNumber}
                                                        </NextLink>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {format(new Date(order.receivedDate), "dd MMM yyyy", { locale: bg })}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className={cn("text-[10px] py-0", statusClasses[order.paymentStatus])}>
                                                        {order.paymentStatus}
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-4 pt-0">
                                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                                    {order.items.map(item => item.detailType).join(', ')}
                                                </p>
                                                <div className="flex justify-end">
                                                    <span className="font-bold text-sm">{formatCurrency(order.totalWithoutVAT)}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )) : (
                                        <div className="text-center py-8 text-muted-foreground text-sm">
                                            Няма намерени поръчки.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-2">
                             <CardHeader>
                                <CardTitle>Лица за контакт</CardTitle>
                            </CardHeader>
                            <CardContent>
                               {client.contacts && client.contacts.length > 0 ? (
                                   <div className="space-y-4">
                                        {client.contacts.map((contact, index) => (
                                            <div key={index}>
                                                <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    <span className="font-medium">{contact.name}</span>
                                                    
                                                    {contact.phone && (
                                                        <>
                                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">{contact.phone}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {index < client.contacts.length - 1 && <Separator className="mt-4" />}
                                            </div>
                                        ))}
                                   </div>
                               ) : (
                                   <p className="text-sm text-muted-foreground">Няма добавени лица за контакт.</p>
                               )}
                            </CardContent>
                        </Card>
                    </div>

                </main>
                
                {isEditing && (
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                        <DialogContent className="sm:max-w-2xl w-[90vw]">
                            <DialogHeader>
                                <DialogTitle>Редактиране на клиент</DialogTitle>
                                <DialogDescription>
                                    Променете данните за {client.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[75vh] -mx-6 px-6">
                                <AddClientForm 
                                    onAddClient={handleUpdate}
                                    initialValues={client}
                                />
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                )}
                
                <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Наистина ли сте сигурни?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Това действие не може да бъде отменено. Това ще изтрие перманентно клиент {client.name} и ще премахне данните му от нашите сървъри. Свързаните поръчки няма да бъдат изтрити.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Отказ</AlertDialogCancel>
                            <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={handleDelete}
                            >
                                Изтрий
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </SidebarInset>
        </SidebarProvider>
    );
}
