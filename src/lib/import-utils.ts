import * as XLSX from 'xlsx';

/**
 * Помощна функция за сигурно парсване на дата от Excel.
 * Справя се с дати, които са сериални номера, стрингове или Date обекти.
 */
export function parseDateSafe(dateValue: any): Date | undefined {
    if (!dateValue) return undefined;
    
    // Ако вече е обект Date
    if (dateValue instanceof Date) {
        return isNaN(dateValue.getTime()) ? undefined : dateValue;
    }

    // Ако е число (Excel дата сериал)
    if (typeof dateValue === 'number') {
        const d = XLSX.SSF.parse_date_code(dateValue);
        // Проверка дали парсването е успешно
        if (d && d.y && d.m && d.d) {
           // Задаваме обяд за да избегнем проблеми с часовите зони, които могат да върнат предния ден
           const date = new Date(d.y, d.m - 1, d.d, 12, 0, 0);
           return isNaN(date.getTime()) ? undefined : date;
        }
        return undefined;
    }

    // Ако е стринг във формат dd.MM.yyyy
    if (typeof dateValue === 'string') {
        const parts = dateValue.split(/[\.\/-]/); // dd.MM.yyyy, dd/MM/yyyy, dd-MM-yyyy
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            let year = parseInt(parts[2], 10);
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                 // Handle 2-digit years
                 if (year < 100) {
                     year += 2000;
                 }
                 const date = new Date(year, month, day, 12, 0, 0);
                 return isNaN(date.getTime()) ? undefined : date;
            }
        }
        
        // Fallback за други стрингови формати (напр. ISO)
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? undefined : date;
    }

    return undefined;
}
