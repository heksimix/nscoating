'use client';

import * as XLSX from 'xlsx';
import { parseDateSafe } from './import-utils';

/**
 * Помощна функция за сигурно преобразуване на стойност в число, като се справя с десетични запетаи.
 */
const safeParseFloat = (value: any): number => {
  if (typeof value === 'number') {
    return isNaN(value) ? 0 : value;
  }
  if (typeof value === 'string') {
    const cleanedString = value.replace(',', '.').trim();
    const num = parseFloat(cleanedString);
    return isNaN(num) ? 0 : num;
  }
  return 0;
};


/**
 * Импортира данни от избран Excel файл.
 */
export const importFromExcel = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // rawNumbers: true помага на XLSX да разпознае числата като такива.
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { rawNumbers: true });

        // Групираме редовете по номер на поръчка, за да можем да съберем артикулите към правилната поръчка
        const ordersMap = new Map<string, any>();

        for (const row of json) {
          const orderNumber = String(row['Номер'] || '');
          if (!orderNumber) continue; // Пропускаме празни редове

          // Ако за първи път срещаме този номер на поръчка, създаваме основния обект
          if (!ordersMap.has(orderNumber)) {
            const statusFromSheet = (row['Статус на плащане'] || '').toString().trim().toLowerCase();
            let paymentStatus: 'Платено' | 'Неплатено' | 'Няма' = 'Неплатено'; // default
            if (statusFromSheet === 'платено') {
                paymentStatus = 'Платено';
            } else if (statusFromSheet === 'няма') {
                paymentStatus = 'Няма';
            }

            ordersMap.set(orderNumber, {
              orderNumber: orderNumber,
              client: row['Клиент'] || '',
              contactPerson: row['Контактно лице'] || '',
              phone: String(row['Телефон'] || ''),
              paymentStatus: paymentStatus,
              paymentMethod: row['Начин на плащане'] || 'В брой',
              receivedDate: parseDateSafe(row['Дата на получаване']) || new Date(),
              paymentDate: parseDateSafe(row['Дата на плащане']),
              reason: row['Причина (ако има)'] || '',
              items: [],
            });
          }

          // Добавяме артикула от текущия ред към масива с артикули на поръчката
          const order = ordersMap.get(orderNumber);
          if (order) {
            order.items.push({
              detailType: row['Тип Детайл'] || '',
              quantity: safeParseFloat(row['Количество']),
              priceWithoutVAT: safeParseFloat(row['Ед. Цена (€)']),
              returnDate: parseDateSafe(row['Дата на връщане']),
            });
          }
        }

        // Преобразуваме картата в масив и изчисляваме общата сума за всяка поръчка
        const mappedData = Array.from(ordersMap.values()).map(order => {
            const totalWithoutVAT = order.items.reduce((sum: number, item: any) => {
                return sum + (item.quantity || 0) * (item.priceWithoutVAT || 0);
            }, 0);
            return {
                ...order,
                totalWithoutVAT: totalWithoutVAT,
            };
        });

        resolve(mappedData);
      } catch (err) {
        console.error("Error during Excel import:", err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
