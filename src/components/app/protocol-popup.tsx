"use client";

import * as React from "react";
import { Loader2, Printer, X, Download } from "lucide-react";
import { HandoverProtocol } from "@/components/app/handover-protocol";
import { Button } from "@/components/ui/button";
import type { Order, Client, ProtocolType } from "@/lib/schemas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { generateProtocolPdf } from "@/lib/generate-protocol-pdf";
import { useCompanyData } from "@/hooks/use-company-data";
import { Separator } from "../ui/separator";

type ProtocolPopupProps = {
  order: Order;
  clients: Client[];
  type: ProtocolType;
  isOpen: boolean;
  onClose: () => void;
};

export function ProtocolPopup({ order, clients, type, isOpen, onClose }: ProtocolPopupProps) {
  const protocolRef = React.useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { companyData } = useCompanyData();

  const clientDetails = clients.find(c => c.name.toLowerCase() === order.client.toLowerCase()) || null;

  const handleGeneratePdf = async (action: 'download' | 'print') => {
    if (!order) return;

    setIsGenerating(true);
    
    try {
        const pdfFile = await generateProtocolPdf(order, clientDetails, companyData, type);
        
        const url = URL.createObjectURL(pdfFile);

        if (action === 'download') {
            const a = document.createElement('a');
            a.href = url;
            a.download = pdfFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else if (action === 'print') {
            const printWindow = window.open(url);
            printWindow?.addEventListener('load', () => {
                printWindow.print();
            });
        }

    } catch (error) {
        console.error("Could not generate PDF", error);
    } finally {
       setIsGenerating(false);
    }
  };

  const protocolTitle = type === "receive" 
    ? "Протокол за приемане" 
    : "Протокол за връщане";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{protocolTitle} - Поръчка #{order.orderNumber}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow bg-muted/40 p-2 rounded-md">
          <div ref={protocolRef} className="bg-white">
            <HandoverProtocol order={order} clientDetails={clientDetails} type={type} />
          </div>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 pt-4 sm:justify-between">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleGeneratePdf('print')} disabled={isGenerating}>
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Printer className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Генериране..." : "Принтирай"}
            </Button>
            <Button size="sm" onClick={() => handleGeneratePdf('download')} disabled={isGenerating} variant="outline">
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {isGenerating ? "Генериране..." : "Свали PDF"}
            </Button>
          </div>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Затвори
              </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
