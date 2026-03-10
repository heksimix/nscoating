"use client";

import * as React from "react";
import { Trash2, Edit, User, Phone, ChevronDown, Eye, MoreHorizontal, FileText, MapPin } from "lucide-react";
import NextLink from "next/link";

import type { Client, Contact } from "@/lib/schemas";
import { useAppData } from "@/hooks/use-app-data";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AddClientForm } from "./add-client-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { ScrollArea } from "../ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Separator } from "../ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../ui/alert-dialog";


const ContactsCell = ({ contacts }: { contacts?: Contact[] }) => {
    if (!contacts || contacts.length === 0) {
        return <span className="text-sm text-muted-foreground">Няма добавени лица за контакт.</span>;
    }

    const firstContact = contacts[0];
    const remainingCount = contacts.length - 1;
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium">{firstContact.name}</span>
            </div>
             {firstContact.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span>{firstContact.phone}</span>
                </div>
            )}
            {remainingCount > 0 && (
                 <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
                    <CollapsibleTrigger asChild>
                        <Button variant="link" className="text-xs text-muted-foreground h-auto p-0 mt-1 justify-start flex items-center gap-1">
                            <span>+ {remainingCount} още</span>
                            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                        <ul className="space-y-3 pt-3">
                            {contacts.slice(1).map((contact, i) => (
                                <li key={i}>
                                    <div className="flex items-center gap-2">
                                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <span className="font-medium">{contact.name}</span>
                                    </div>
                                    {contact.phone && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            <span>{contact.phone}</span>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </CollapsibleContent>
                 </Collapsible>
            )}
        </div>
    );
};


export function ClientManagement() {
  const { clients, updateClient, deleteClient } = useAppData();
  const [editingClient, setEditingClient] = React.useState<Client | null>(null);
  const [deletingClient, setDeletingClient] = React.useState<Client | null>(null);

  const handleEditClick = (client: Client) => {
    setEditingClient(client);
  };
  
  const handleEditClient = (updatedClientData: Client) => {
     updateClient(updatedClientData);
     setEditingClient(null);
  }

  const handleDeleteConfirm = () => {
    if (deletingClient) {
        deleteClient(deletingClient.id);
        setDeletingClient(null);
    }
  }

  return (
    <div>
      {/* Desktop View */}
      <div className="hidden lg:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клиент / Компания</TableHead>
              <TableHead>Контакти</TableHead>
              <TableHead className="hidden md:table-cell">Адрес</TableHead>
              <TableHead className="hidden md:table-cell">ЕИК</TableHead>
              <TableHead className="w-[120px] text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-semibold">
                  <NextLink href={`/clients/${client.id}`} className="hover:underline">
                    {client.name}
                  </NextLink>
                </TableCell>
                <TableCell>
                    <ContactsCell contacts={client.contacts} />
                </TableCell>
                <TableCell className="hidden md:table-cell">{client.address || '-'}</TableCell>
                <TableCell className="hidden md:table-cell">{client.eik || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center justify-end rounded-md bg-muted/50 p-0.5">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:bg-background" title="Преглед">
                        <NextLink href={`/clients/${client.id}`}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">Преглед</span>
                        </NextLink>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-background"
                      onClick={() => handleEditClick(client)}
                      title="Редактирай"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Редактирай</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:bg-background hover:text-destructive"
                      onClick={() => setDeletingClient(client)}
                      title="Изтрий"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Изтрий</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
             {clients.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">Няма намерени клиенти.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile & Tablet View */}
        <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {clients.map((client) => (
                <Card key={client.id} className="break-inside-avoid">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <CardTitle className="text-base font-bold break-words pr-2">
                                <NextLink href={`/clients/${client.id}`} className="hover:underline">
                                    {client.name}
                                </NextLink>
                            </CardTitle>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                                        <span className="sr-only">Отвори меню</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={() => handleEditClick(client)}>
                                        <Edit className="mr-2 h-4 w-4" /> Редактирай
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <NextLink href={`/clients/${client.id}`}>
                                            <Eye className="mr-2 h-4 w-4" /> Преглед
                                        </NextLink>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => setDeletingClient(client)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" /> Изтрий
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <Separator />
                        <div className="space-y-2">
                            {client.address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                    <span className="break-words">{client.address}</span>
                                </div>
                            )}
                            {client.eik && (
                                <div className="flex items-start gap-2">
                                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                                    <span>ЕИК: {client.eik}</span>
                                </div>
                            )}
                        </div>
                        {(client.address || client.eik) && (client.contacts && client.contacts.length > 0) && <Separator />}
                        <div>
                             <ContactsCell contacts={client.contacts} />
                        </div>
                    </CardContent>
                </Card>
            ))}
            {clients.length === 0 && (
                <div className="text-center p-8 text-muted-foreground col-span-full">Няма намерени клиенти.</div>
            )}
        </div>
      
      {editingClient && (
        <Dialog open={!!editingClient} onOpenChange={() => setEditingClient(null)}>
            <DialogContent className="sm:max-w-2xl w-[90vw]">
                <DialogHeader>
                    <DialogTitle>Редактиране на клиент</DialogTitle>
                    <DialogDescription>
                        Променете данните за {editingClient.name}.
                    </DialogDescription>
                </DialogHeader>
                 <ScrollArea className="max-h-[75vh] -mx-6 px-6">
                    <AddClientForm 
                        onAddClient={(values) => handleEditClient({...values, id: editingClient.id})}
                        initialValues={editingClient}
                    />
                 </ScrollArea>
            </DialogContent>
        </Dialog>
      )}

        <AlertDialog open={!!deletingClient} onOpenChange={() => setDeletingClient(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Наистина ли сте сигурни?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Това действие не може да бъде отменено. Това ще изтрие перманентно клиент {deletingClient?.name} и ще премахне данните му от нашите сървъри. Свързаните поръчки няма да бъдат изтрити.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отказ</AlertDialogCancel>
                    <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDeleteConfirm}
                    >
                        Изтрий
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </div>
  );
}
