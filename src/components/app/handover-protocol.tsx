"use client";

import * as React from "react";
import { format } from "date-fns";
import type { Order, Client, ProtocolType } from "@/lib/schemas";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCompanyData } from "@/hooks/use-company-data";
import Image from "next/image";

interface HandoverProtocolProps {
  order: Order;
  clientDetails?: Client | null;
  type: ProtocolType;
}

export function HandoverProtocol({ order, clientDetails, type }: HandoverProtocolProps) {
  const { companyData } = useCompanyData();

  const isReturnProtocol = type === 'return';
  
  const firstReturnDate = order.items.map(i => i.returnDate).find(d => d);
  const protocolDate = isReturnProtocol 
    ? (firstReturnDate ? new Date(firstReturnDate) : new Date())
    : new Date(order.receivedDate);

  const protocolTitle = isReturnProtocol
    ? "Приемо-предавателен протокол за върната стока"
    : "Приемо-предавателен протокол за приета стока";
  
  const formattedDate = format(protocolDate, "dd.MM.yyyy 'г.'");

  const clientInfo = { 
    name: clientDetails?.name || order.client, 
    address: clientDetails?.address || "Няма данни", 
    eik: clientDetails?.eik || "Няма данни", 
    mol: order.contactPerson || order.client 
  };
  
  const giverParty = isReturnProtocol ? companyData : clientInfo;
  const receiverParty = isReturnProtocol ? clientInfo : companyData;
    
  return (
    <div className="bg-card text-card-foreground p-12 leading-relaxed">
      {/* --- HEADER --- */}
      <header className="flex flex-col items-center justify-center text-center mb-16">
        {companyData.logoUrl && (
          <div className="mb-6 h-24 w-24 relative">
            <Image 
              src={companyData.logoUrl} 
              alt="Company Logo" 
              layout="fill"
              objectFit="contain"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-wider uppercase">{protocolTitle}</h1>
        <p className="text-lg mt-2">№ {order.orderNumber} / {formattedDate}</p>
      </header>

      {/* --- PARTIES --- */}
      <section className="mb-12 text-sm">
        <div className="grid grid-cols-2 gap-12">
          {/* Giver */}
          <div className="space-y-2">
            <h2 className="text-base font-semibold border-b pb-2 mb-4">ПРЕДАЛ:</h2>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-baseline">
              <span className="font-semibold text-muted-foreground">Фирма/Клиент:</span>
              <span className="font-bold">{giverParty.name}</span>
              
              <span className="font-semibold text-muted-foreground">Адрес:</span>
              <span>{giverParty.address || 'Няма данни'}</span>

              <span className="font-semibold text-muted-foreground">ЕИК/ЕГН:</span>
              <span>{giverParty.eik || 'Няма данни'}</span>
              
              <span className="font-semibold text-muted-foreground">Представител:</span>
              <span>{giverParty.mol}</span>
            </div>
          </div>
          {/* Receiver */}
          <div className="space-y-2">
            <h2 className="text-base font-semibold border-b pb-2 mb-4">ПРИЕЛ:</h2>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-baseline">
              <span className="font-semibold text-muted-foreground">Фирма/Клиент:</span>
              <span className="font-bold">{receiverParty.name}</span>
              
              <span className="font-semibold text-muted-foreground">Адрес:</span>
              <span>{receiverParty.address || 'Няма данни'}</span>

              <span className="font-semibold text-muted-foreground">ЕИК/ЕГН:</span>
              <span>{receiverParty.eik || 'Няма данни'}</span>
              
              <span className="font-semibold text-muted-foreground">Представител:</span>
              <span>{receiverParty.mol}</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- ITEMS TABLE --- */}
      <section className="mb-12">
         <h3 className="mb-4 text-base font-semibold">Настоящият протокол удостоверява предаването и приемането на следните артикули:</h3>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold w-[60%] p-4">Тип детайл</TableHead>
                <TableHead className="text-center font-bold p-4">Количество</TableHead>
                <TableHead className="text-right font-bold p-4">Дата на връщане</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item, index) => (
                <TableRow key={index} className="[&_td]:py-3 [&_td]:px-4">
                  <TableCell className="font-medium">{item.detailType}</TableCell>
                  <TableCell className="text-center">{item.quantity} бр.</TableCell>
                   <TableCell className="text-right">{item.returnDate ? format(new Date(item.returnDate), "dd.MM.yyyy") : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {order.paymentMethod === "Няма" && order.reason && (
             <p className="mt-6 text-sm">
                <span className="font-semibold text-card-foreground">Допълнителна информация/Причина:</span> {order.reason}
             </p>
        )}
      </section>

       {/* --- TERMS & FOOTER --- */}
      <footer className="space-y-16">
        {isReturnProtocol && (
            <section className="text-sm text-muted-foreground italic space-y-3">
                <p>Предадените/приетите артикули са в изправност и съответстват на описаното. Приемащата страна удостоверява с подписа си, че няма претенции към вида и количеството им.</p>
                <p>Настоящият протокол се състави в два еднообразни екземпляра - по един за всяка от страните.</p>
            </section>
        )}
        
        <div className="grid grid-cols-2 gap-20 pt-16 text-sm">
            <div className="text-center">
                <div className="border-t pt-3 mt-4">
                    <p className="text-xs text-muted-foreground mb-8">(подпис)</p>
                    <p className="font-semibold">Предал:</p>
                </div>
            </div>
            <div className="text-center">
                <div className="border-t pt-3 mt-4">
                    <p className="text-xs text-muted-foreground mb-8">(подпис)</p>
                    <p className="font-semibold">Приел:</p>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
