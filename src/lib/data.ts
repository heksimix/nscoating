import { Order, Client, FixedExpense } from "./schemas";

export const initialClients: Omit<Client, 'id'>[] = [
  {
    name: "Техно Прогрес ООД",
    address: "гр. София, бул. България 102",
    eik: "123456789",
    contacts: [
      { name: "Иван Иванов", phone: "0888123456" },
      { name: "Мария Петрова", phone: "0888654321" }
    ]
  },
  {
    name: "Евро Логистик ЕООД",
    address: "гр. Пловдив, ул. Индустриална 5",
    eik: "987654321",
    contacts: [
      { name: "Георги Георгиев", phone: "0877112233" }
    ]
  }
];

export const initialOrders: any[] = [
  {
    orderNumber: "1001",
    client: "Техно Прогрес ООД",
    contactPerson: "Иван Иванов",
    phone: "0888123456",
    items: [
      { detailType: "Лазерно рязане - Стойки", quantity: 50, priceWithoutVAT: 12.50 },
      { detailType: "Огъване на елементи", quantity: 20, priceWithoutVAT: 5.00 }
    ],
    paymentMethod: "Банков превод",
    paymentStatus: "Платено",
    receivedDate: new Date(),
    paymentDate: new Date(),
    totalWithoutVAT: 725.00
  },
  {
    orderNumber: "1002",
    client: "Евро Логистик ЕООД",
    contactPerson: "Георги Георгиев",
    phone: "0877112233",
    items: [
      { detailType: "Прахово боядисване", quantity: 100, priceWithoutVAT: 3.20 }
    ],
    paymentMethod: "В брой",
    paymentStatus: "Неплатено",
    receivedDate: new Date(),
    totalWithoutVAT: 320.00
  }
];

export const initialFixedExpenses: Omit<FixedExpense, 'id'>[] = [
  {
    name: "Наем на склад",
    paymentMethod: "bank_transfer",
    vatType: "vat_20",
    isRecurring: true,
    creationMonth: "2026-01",
    userId: "system"
  },
  {
    name: "Електричество",
    paymentMethod: "card",
    vatType: "vat_20",
    isRecurring: true,
    creationMonth: "2026-01",
    userId: "system"
  },
  {
    name: "Интернет и телефон",
    paymentMethod: "bank_transfer",
    vatType: "vat_20",
    isRecurring: true,
    creationMonth: "2026-01",
    userId: "system"
  }
];