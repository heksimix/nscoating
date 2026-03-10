"use client";

import * as React from "react";
import type { UseFormReturn } from "react-hook-form";
import { Check, UserPlus, Search, CalendarIcon } from "lucide-react";
import { format, isValid } from "date-fns";
import { bg } from "date-fns/locale";

import { cn } from "@/lib/utils";
import type { OrderFormData, Client } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppData } from "@/hooks/use-app-data";
import { AddClientForm } from "@/components/app/add-client-form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";


interface ClientInfoSectionProps {
    form: UseFormReturn<OrderFormData>;
    clients: Client[];
}

export function ClientInfoSection({ form, clients }: ClientInfoSectionProps) {
    const { addClient } = useAppData();
    const [isClientDialogOpen, setClientDialogOpen] = React.useState(false);
    const [isAddClientDialogOpen, setAddClientDialogOpen] = React.useState(false);
    const [newClientName, setNewClientName] = React.useState('');
    const [selectedClient, setSelectedClient] = React.useState<Client | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isReceivedOpen, setIsReceivedOpen] = React.useState(false);

    const clientName = form.watch('client');

    React.useEffect(() => {
        const client = clients.find(c => c.name.toLowerCase() === clientName?.toLowerCase()) || null;
        setSelectedClient(client);

        if (!client) {
             form.setValue('contactPerson', '');
             form.setValue('phone', '');
        } else if (client.contacts && client.contacts.length === 1) {
             form.setValue('contactPerson', client.contacts[0].name);
             form.setValue('phone', client.contacts[0].phone || '');
        } else if (client.contacts && client.contacts.length === 0) {
            form.setValue('contactPerson', '');
            form.setValue('phone', '');
        }

    }, [clientName, clients, form]);

    const handleContactChange = (contactName: string) => {
        const contact = selectedClient?.contacts?.find(c => c.name === contactName);
        if (contact) {
            form.setValue("contactPerson", contact.name, { shouldValidate: true });
            form.setValue("phone", contact.phone || "", { shouldValidate: true });
        }
    };
    
    const handleClientSelect = (clientNameToSelect: string) => {
        form.setValue("client", clientNameToSelect, { shouldValidate: true });
        setClientDialogOpen(false);
        setSearchQuery('');
    };
    
    const handleOpenAddClientDialog = (name: string) => {
        setNewClientName(name);
        setClientDialogOpen(false);
        setAddClientDialogOpen(true);
    };

    const handleAddClient = (newClientData: Omit<Client, "id">) => {
        addClient(newClientData);
        setAddClientDialogOpen(false); // Close the 'add client' dialog
        
        // now update the order form with the new client
        form.setValue("client", newClientData.name, { shouldValidate: true });
        setSearchQuery('');
    };

    const filteredClients = searchQuery 
        ? clients.filter(client => client.name.toLowerCase().includes(searchQuery.toLowerCase()))
        : clients;

    const parseDate = (val: any): Date | undefined => {
        if (!val) return undefined;
        const d = new Date(val);
        return isValid(d) ? d : undefined;
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                <FormField
                    control={form.control}
                    name="client"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Клиент</FormLabel>
                            <Dialog open={isClientDialogOpen} onOpenChange={setClientDialogOpen}>
                                <DialogTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start text-left font-normal"
                                        >
                                            {field.value ? field.value : <span className="text-muted-foreground">Избери или създай клиент</span>}
                                        </Button>
                                    </FormControl>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>Избор на клиент</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-2">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Търсене или създаване..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                        <ScrollArea className="h-[300px]">
                                            <div className="p-1">
                                                {filteredClients.length > 0 ? (
                                                    filteredClients.map((client) => (
                                                        <Button
                                                            key={client.id}
                                                            variant="ghost"
                                                            className="w-full justify-start gap-2"
                                                            onClick={() => handleClientSelect(client.name)}
                                                        >
                                                            <Check className={cn("h-4 w-4", clientName === client.name ? "opacity-100" : "opacity-0")} />
                                                            {client.name}
                                                        </Button>
                                                    ))
                                                ) : (
                                                    <div className="py-4 text-center text-sm">
                                                        <p>Няма намерен клиент.</p>
                                                        {searchQuery.trim() && (
                                                            <Button variant="link" className="h-auto p-1 mt-2" onClick={() => handleOpenAddClientDialog(searchQuery)}>
                                                                <UserPlus className="mr-2 h-4 w-4" />
                                                                Създай нов клиент "{searchQuery}"
                                                            </Button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                {selectedClient && selectedClient.contacts && selectedClient.contacts.length > 1 ? (
                    <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Лице за контакт</FormLabel>
                                <Select onValueChange={handleContactChange} value={field.value || ''}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Изберете..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {selectedClient.contacts?.map((contact, index) => (
                                            <SelectItem key={index} value={contact.name}>{contact.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : (
                    <FormField
                        control={form.control}
                        name="contactPerson"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Лице за контакт</FormLabel>
                                <FormControl>
                                    <Input {...field} value={field.value || ''} disabled={!!(selectedClient && selectedClient.contacts && selectedClient.contacts.length === 1)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}
                 <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Телефон</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value || ''} disabled={!!(selectedClient && selectedClient.contacts && selectedClient.contacts.length > 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="receivedDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Дата на получаване</FormLabel>
                            <Popover open={isReceivedOpen} onOpenChange={setIsReceivedOpen} modal={true}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(new Date(field.value), "PPP", { locale: bg }) : <span>Изберете дата</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        locale={bg}
                                        mode="single"
                                        selected={parseDate(field.value)}
                                        onSelect={(date) => {
                                            if (date) {
                                                field.onChange(date);
                                                setIsReceivedOpen(false);
                                                const items = form.getValues("items");
                                                const newItems = items.map(item => {
                                                    if(date && item.returnDate && new Date(item.returnDate) < date) {
                                                        return {...item, returnDate: undefined}
                                                    }
                                                    return item;
                                                })
                                                form.setValue("items", newItems);
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>


            <Dialog open={isAddClientDialogOpen} onOpenChange={setAddClientDialogOpen}>
              <DialogContent className="sm:max-w-2xl w-[90vw]">
                <DialogHeader>
                  <DialogTitle>Добави нов клиент</DialogTitle>
                   <DialogDescription>
                    Попълнете формата, за да добавите нов клиент към списъка.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[calc(100vh-12rem)] -mx-6 px-6">
                  <AddClientForm
                    onAddClient={handleAddClient}
                    initialValues={{
                      id: `temp-${Date.now()}`,
                      name: newClientName,
                      eik: null,
                      address: null,
                      contacts: [{ name: newClientName, phone: '' }],
                    }}
                  />
                </ScrollArea>
              </DialogContent>
            </Dialog>

        </div>
    );
}
    