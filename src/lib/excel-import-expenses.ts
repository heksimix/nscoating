'use client';

import * as XLSX from 'xlsx';
import { parseDateSafe } from './import-utils';

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

export interface ImportedExpensesData {
    monthlyIncomes: any[];
    variableExpenses: any[];
    monthlyExpenses: any[];
}

export const importExpensesFromExcel = (file: File): Promise<ImportedExpensesData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const importedData: ImportedExpensesData = {
            monthlyIncomes: [],
            variableExpenses: [],
            monthlyExpenses: [],
        };

        // Import Monthly Incomes from "Приходи" sheet
        const incomeSheet = workbook.Sheets["Приходи"];
        if(incomeSheet) {
            const incomesJson = XLSX.utils.sheet_to_json(incomeSheet, { rawNumbers: true });
            importedData.monthlyIncomes = incomesJson.map((row: any) => ({
                month: String(row['Месец (ГГГГ-ММ)'] ?? ''),
                bank: safeParseFloat(row['Приход Банка (без ДДС)']),
                cash: safeParseFloat(row['Приход Каса (без ДДС)']),
            }));
        }

        // Import Variable Expenses from "Променливи разходи" sheet
        const variableSheet = workbook.Sheets["Променливи разходи"];
        if(variableSheet) {
            const variableJson = XLSX.utils.sheet_to_json(variableSheet, { rawNumbers: true });
            importedData.variableExpenses = variableJson.map((row: any) => ({
                date: parseDateSafe(row['Дата']),
                name: String(row['Име'] ?? ''),
                amount: safeParseFloat(row['Сума (без ДДС)']),
                hasInvoice: String(row['С Фактура']).toUpperCase() === 'ДА',
            }));
        }

        // Import Fixed Expenses (Monthly Values) from "Постоянни разходи" sheet
        const fixedSheet = workbook.Sheets["Постоянни разходи"];
        if(fixedSheet) {
            const fixedJson = XLSX.utils.sheet_to_json(fixedSheet, { rawNumbers: true });
             importedData.monthlyExpenses = fixedJson.map((row: any) => ({
                expenseId: String(row['ID на разход'] ?? ''),
                month: String(row['Месец (ГГГГ-ММ)'] ?? ''),
                amount: safeParseFloat(row['Сума (без ДДС)']),
             }));
        }

        resolve(importedData);
      } catch (err) {
        console.error("Error during expenses Excel import:", err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
