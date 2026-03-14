'use client';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Order, Client, ProtocolType } from './schemas';
import { CompanyData } from './schemas';

/**
 * Генерира PDF файл от елемента на протокола в DOM.
 */
export const generateProtocolPdf = async (
  order: Order, 
  clientDetails: Client | null, 
  companyData: CompanyData, 
  type: ProtocolType
): Promise<File> => {
  // Намираме елемента, който съдържа протокола в ProtocolPopup
  const element = document.querySelector('.bg-white') as HTMLElement;
  if (!element) throw new Error("Protocol element not found");

  const canvas = await html2canvas(element, {
    scale: 2, // По-високо качество
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
  const blob = pdf.output('blob');
  const fileName = `Protocol_${type === 'receive' ? 'P' : 'V'}_${order.orderNumber}.pdf`;
  
  return new File([blob], fileName, { type: 'application/pdf' });
};
