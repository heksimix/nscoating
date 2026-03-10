import { Order } from "./schemas";
import { isWithinInterval, startOfDay, endOfDay } from "date-fns";

export interface LocalReportOutput {
  orders: Order[];
  totalValueForPeriod: number;
  totalValueByBank: number;
  totalValueByCash: number;
  totalTurnover: number;
  bankTransferTurnover: number;
  cashTurnover: number;
  unpaidForPeriod: number;
  totalUnpaid: number;
}

/**
 * Генерира статистически отчет за поръчките в рамките на избран времеви интервал.
 * Ако интервалът е undefined, се връщат данни за всички поръчки.
 */
export function generateLocalReport(orders: Order[], interval?: { start: Date; end: Date }): LocalReportOutput {
  let filteredOrders = orders;

  if (interval) {
    const from = startOfDay(interval.start);
    const to = endOfDay(interval.end);

    filteredOrders = orders.filter(order => {
      const receivedDate = new Date(order.receivedDate);
      return isWithinInterval(receivedDate, { start: from, end: to });
    });
  }

  // Общо неплатени от всички поръчки (не само за периода)
  const totalUnpaid = orders
    .filter(o => o.paymentStatus === 'Неплатено')
    .reduce((sum, o) => sum + (o.totalWithoutVAT || 0), 0);

  // Изчисляваме статистиките за периода (или общо, ако няма филтър)
  const stats = filteredOrders.reduce((acc, order) => {
    const amount = order.totalWithoutVAT || 0;
    
    // Обща стойност на създадените поръчки
    acc.totalValueForPeriod += amount;

    // Стойност по начин на плащане
    if (order.paymentMethod === 'Банков превод') {
      acc.totalValueByBank += amount;
    } else if (order.paymentMethod === 'В брой') {
      acc.totalValueByCash += amount;
    }

    // Реални приходи (само от платени поръчки)
    if (order.paymentStatus === 'Платено') {
      acc.totalTurnover += amount;
      if (order.paymentMethod === 'Банков превод') {
        acc.bankTransferTurnover += amount;
      } else if (order.paymentMethod === 'В брой') {
        acc.cashTurnover += amount;
      }
    }

    // Неплатени поръчки, създадени в периода
    if (order.paymentStatus === 'Неплатено') {
      acc.unpaidForPeriod += amount;
    }

    return acc;
  }, {
    totalValueForPeriod: 0,
    totalValueByBank: 0,
    totalValueByCash: 0,
    totalTurnover: 0,
    bankTransferTurnover: 0,
    cashTurnover: 0,
    unpaidForPeriod: 0
  });

  return {
    orders: filteredOrders.sort((a, b) => new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()),
    ...stats,
    totalUnpaid
  };
}
