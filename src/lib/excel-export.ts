'use client';

import * as XLSX from 'xlsx';
import { Order } from './schemas';
import { format } from 'date-fns';

/**
 * Експортира масив от поръчки в Excel файл.
 */
export const exportToExcel = (orders: Order[]) => {
  if (!orders || orders.length === 0) return;

  // 1. Сортиране на поръчките от най-новата към най-старата
  const sortedOrders = [...orders].sort((a, b) => {
    const numA = parseInt(a.orderNumber, 10) || 0;
    const numB = parseInt(b.orderNumber, 10) || 0;
    return numB - numA;
  });

  const flattenedData = sortedOrders.flatMap(order => {
    if (order.items && order.items.length > 0) {
      return order.items.map(item => ({
        'Номер': order.orderNumber,
        'Клиент': order.client,
        'Контактно лице': order.contactPerson || '',
        'Телефон': order.phone || '',
        'Тип Детайл': item.detailType,
        'Количество': item.quantity,
        'Ед. Цена (€)': item.priceWithoutVAT,
        'Общо (€)': (item.quantity || 0) * (item.priceWithoutVAT || 0),
        'Статус на плащане': order.paymentStatus,
        'Начин на плащане': order.paymentMethod,
        'Дата на получаване': order.receivedDate ? format(new Date(order.receivedDate), 'dd.MM.yyyy') : '',
        'Дата на връщане': item.returnDate ? format(new Date(item.returnDate), 'dd.MM.yyyy') : '',
        'Дата на плащане': order.paymentDate ? format(new Date(order.paymentDate), 'dd.MM.yyyy') : '',
        'Причина (ако има)': order.reason || ''
      }));
    }
    // Handle orders with no items
    return {
        'Номер': order.orderNumber,
        'Клиент': order.client,
        'Контактно лице': order.contactPerson || '',
        'Телефон': order.phone || '',
        'Тип Детайл': '',
        'Количество': 0,
        'Ед. Цена (€)': 0,
        'Общо (€)': 0,
        'Статус на плащане': order.paymentStatus,
        'Начин на плащане': order.paymentMethod,
        'Дата на получаване': order.receivedDate ? format(new Date(order.receivedDate), 'dd.MM.yyyy') : '',
        'Дата на връщане': '',
        'Дата на плащане': order.paymentDate ? format(new Date(order.paymentDate), 'dd.MM.yyyy') : '',
        'Причина (ако има)': order.reason || ''
    };
  });
  
  if (flattenedData.length === 0) return;

  const worksheet = XLSX.utils.json_to_sheet(flattenedData);

  // 2. Автоматично оразмеряване на колоните
  const columnKeys = Object.keys(flattenedData[0]);
  const columnWidths = columnKeys.map(key => {
    const headerLength = key.length;
    const dataLengths = flattenedData.map(row => {
        const value = row[key as keyof typeof row];
        return value !== null && value !== undefined ? String(value).length : 0;
    });
    const maxLength = Math.max(headerLength, ...dataLengths);
    return { wch: maxLength + 2 }; // Добавяме малко отстояние
  });
  worksheet['!cols'] = columnWidths;


  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Поръчки");

  // Генериране на файла и стартиране на свалянето
  const fileName = `Export_Orders_${format(new Date(), 'dd-MM-yyyy_HHmm')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};
