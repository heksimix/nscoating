'use client';

import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { bg } from 'date-fns/locale';
import type { FixedExpense, MonthlyExpense, VariableExpense, MonthlyIncome } from './schemas';

interface AppData {
  fixedExpenses: FixedExpense[];
  monthlyExpenses: MonthlyExpense[];
  variableExpenses: VariableExpense[];
  monthlyIncomes: MonthlyIncome[];
}

const formatCurrencyForSheet = (amount: number) => {
    // XLSX understands numbers, so we pass numbers for calculations
    // We can set number format in the sheet for display
    return amount;
};

export const exportExpensesToExcel = (appData: AppData, month: Date) => {
    const { fixedExpenses, monthlyExpenses, variableExpenses, monthlyIncomes } = appData;

    // --- Calculation logic from ExpensesManagement ---
    const monthString = format(month, 'yyyy-MM');
    const currentMonthIncome = monthlyIncomes.find(i => i.month === monthString) || { month: monthString, bank: 0, cash: 0 };
    
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const bankTransferFixedExpenses = fixedExpenses
        .filter(e => e.paymentMethod === 'bank_transfer')
        .filter(e => {
            if (!e.creationMonth) return true;
            const isRecurring = e.isRecurring !== false;
            return isRecurring ? e.creationMonth <= monthString : e.creationMonth === monthString;
        });

    const cardFixedExpenses = fixedExpenses
        .filter(e => e.paymentMethod === 'card')
        .filter(e => {
            if (!e.creationMonth) return true;
            const isRecurring = e.isRecurring !== false;
            return isRecurring ? e.creationMonth <= monthString : e.creationMonth === monthString;
        });

    const currentMonthVariableExpenses = variableExpenses.filter(expense => 
        isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
    );
    
    const variableWithInvoice = currentMonthVariableExpenses.filter(e => e.hasInvoice);
    const variableWithoutInvoice = currentMonthVariableExpenses.filter(e => !e.hasInvoice);

    const getMonthlySum = (expenseList: FixedExpense[]) => {
        return expenseList.reduce((sum, expense) => {
            const monthlyValue = monthlyExpenses.find(me => me.expenseId === expense.id && me.month === monthString)?.amount || 0;
            return sum + monthlyValue;
        }, 0);
    };
    
    const totalIncome = currentMonthIncome.bank + currentMonthIncome.cash;

    const totalMonthlyBankTransfer = getMonthlySum(bankTransferFixedExpenses);
    const totalMonthlyCard = getMonthlySum(cardFixedExpenses);
    
    const totalVariableWithInvoice = variableWithInvoice.reduce((sum, e) => sum + e.amount, 0);
    const totalVariableWithoutInvoice = variableWithoutInvoice.reduce((sum, e) => sum + e.amount, 0);
    const totalVariableTax = totalVariableWithoutInvoice * 1.2 * 0.1;
    
    const totalBankExpenses = totalMonthlyBankTransfer + totalMonthlyCard + totalVariableTax;
    const totalCashExpenses = totalVariableWithInvoice;
    
    const totalExpenses = totalBankExpenses + totalCashExpenses + totalVariableWithoutInvoice;
    
    const totalProfit = totalIncome - totalExpenses;
    
    const cashBalance = (currentMonthIncome.cash * 1.2) - 
        (variableWithInvoice.reduce((sum, e) => sum + (e.amount * 1.2), 0)) -
        (variableWithoutInvoice.reduce((sum, e) => sum + (e.amount * 1.2), 0));


    // --- Build Worksheet Data ---
    const workbook = XLSX.utils.book_new();

    // --- Report Sheet ---
    const data: (string | number | Date | null)[][] = [];
    const addRow = (values: (string | number | Date | null)[]) => data.push(values);
    const addEmptyRow = () => addRow([]);

    addRow([`Справка Приходи и Разходи за ${format(month, 'LLLL yyyy', { locale: bg })}`]);
    addEmptyRow();

    addRow(['ОБОБЩЕНИЕ']);
    addRow(['Общо приходи (без ДДС)', formatCurrencyForSheet(totalIncome)]);
    addRow(['Общо разходи (без ДДС)', formatCurrencyForSheet(totalExpenses)]);
    addRow(['Печалба за месеца (без ДДС)', formatCurrencyForSheet(totalProfit)]);
    addRow(['Наличност в каса (с ДДС)', formatCurrencyForSheet(cashBalance)]);
    addEmptyRow();

    addRow(['ПРИХОДИ (без ДДС)']);
    addRow(['По Банка', formatCurrencyForSheet(currentMonthIncome.bank)]);
    addRow(['В брой (Каса)', formatCurrencyForSheet(currentMonthIncome.cash)]);
    addRow(['ОБЩО ПРИХОДИ', formatCurrencyForSheet(totalIncome)]);
    addEmptyRow();

    addRow(['РАЗХОДИ (без ДДС)']);
    addRow(['Плащания по банков път']);
    bankTransferFixedExpenses.forEach(exp => {
        const amount = monthlyExpenses.find(me => me.expenseId === exp.id && me.month === monthString)?.amount || 0;
        addRow([`  ${exp.name}`, formatCurrencyForSheet(amount)]);
    });
    addRow(['Общо банков път', formatCurrencyForSheet(totalMonthlyBankTransfer)]);
    addEmptyRow();
    
    addRow(['Плащания с карта']);
    cardFixedExpenses.forEach(exp => {
        const amount = monthlyExpenses.find(me => me.expenseId === exp.id && me.month === monthString)?.amount || 0;
        addRow([`  ${exp.name}`, formatCurrencyForSheet(amount)]);
    });
    addRow(['Общо с карта', formatCurrencyForSheet(totalMonthlyCard)]);
    addEmptyRow();

    addRow(['Данък 10% от плащания в брой без фактура', formatCurrencyForSheet(totalVariableTax)]);
    addEmptyRow();
    
    addRow(['Разходи Каса (Плащания в брой)']);
    addRow(['Плащания с фактура']);
    variableWithInvoice.forEach(exp => addRow([`  ${exp.name}`, formatCurrencyForSheet(exp.amount)]));
    addRow(['Общо с фактура', formatCurrencyForSheet(totalVariableWithInvoice)]);
    addEmptyRow();

    addRow(['Плащания без фактура']);
    variableWithoutInvoice.forEach(exp => addRow([`  ${exp.name}`, formatCurrencyForSheet(exp.amount)]));
    addRow(['Общо без фактура', formatCurrencyForSheet(totalVariableWithoutInvoice)]);
    addEmptyRow();

    addRow(['ОБЩО РАЗХОДИ', formatCurrencyForSheet(totalExpenses)]);

    const reportSheet = XLSX.utils.aoa_to_sheet(data);

    // Apply currency formatting to number columns
    const euroFormat = '#,##0.00 €';
    const range = XLSX.utils.decode_range(reportSheet['!ref'] || 'A1');
    for (let R = range.s.r; R <= range.e.r; ++R) {
        const cell_address = { c: 1, r: R }; // Column B
        const cell = XLSX.utils.encode_cell(cell_address);
        if (reportSheet[cell] && reportSheet[cell].t === 'n') {
            reportSheet[cell].z = euroFormat;
        }
    }
    
    reportSheet['!cols'] = [{ wch: 40 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(workbook, reportSheet, `Справка ${format(month, 'MM-yyyy')}`);

    // --- Raw Data Sheets ---
    // Incomes
    if (currentMonthIncome.bank > 0 || currentMonthIncome.cash > 0) {
        const incomeData = [{
            'Месец (ГГГГ-ММ)': currentMonthIncome.month,
            'Приход Банка (без ДДС)': currentMonthIncome.bank,
            'Приход Каса (без ДДС)': currentMonthIncome.cash,
        }];
        const incomeSheet = XLSX.utils.json_to_sheet(incomeData);
        incomeSheet['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 25 }];
        XLSX.utils.book_append_sheet(workbook, incomeSheet, "Приходи");
    }

    // Variable expenses
    if (currentMonthVariableExpenses.length > 0) {
        const variableData = currentMonthVariableExpenses.map(exp => ({
            'Дата': new Date(exp.date),
            'Име': exp.name,
            'Сума (без ДДС)': exp.amount,
            'С Фактура': exp.hasInvoice ? 'ДА' : 'НЕ'
        }));
        const variableSheet = XLSX.utils.json_to_sheet(variableData, { cellDates: true });
        variableSheet['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, variableSheet, "Променливи разходи");
    }
    
    // Fixed expenses
    const fixedExpensesForMonth = monthlyExpenses.filter(me => me.month === monthString);
    if (fixedExpensesForMonth.length > 0) {
        const fixedData = fixedExpensesForMonth.map(me => {
            const fixedExpenseInfo = fixedExpenses.find(fe => fe.id === me.expenseId);
            return {
                'ID на разход': me.expenseId,
                'Име': fixedExpenseInfo?.name || 'НЕИЗВЕСТЕН РАЗХОД',
                'Месец (ГГГГ-ММ)': me.month,
                'Сума (без ДДС)': me.amount
            };
        });
        const fixedSheet = XLSX.utils.json_to_sheet(fixedData);
        fixedSheet['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, fixedSheet, "Постоянни разходи");
    }

    const fileName = `Expenses_Report_${format(month, 'yyyy-MM')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
};
