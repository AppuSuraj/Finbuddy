
import fs from 'fs';
import path from 'path';

const csvPath = 'c:/Users/suraj/OneDrive/Documents/Google Antigravity/Agents/Finbuddy/holdings.csv';
const content = fs.readFileSync(csvPath, 'utf8');

const parseCsvToGrid = (text) => {
    // Simple robust CSV splitter that handles quotes
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    if (currentRow.length > 0) rows.push(currentRow);
    return rows;
};

const cleanCell = (v) => String(v || '').replace(/"/g, '').trim().toLowerCase();

const stockKeywords = ['instrument', 'stock name', 'quantity', 'qty', 'avg', 'closing', 'current value', 'invested', 'buy value', 'isin', 'symbol', 'security', 'scrip'];

const grid = parseCsvToGrid(content);
let headerRowIdx = -1;

for (let i = 0; i < Math.min(grid.length, 100); i++) {
    const row = grid[i];
    const cleanedValues = row.map(cleanCell);
    const matchCount = stockKeywords.filter(k => cleanedValues.some(cv => cv === k || (cv.length > 3 && cv.includes(k)))).length;
    
    if (matchCount >= 2) {
        console.log(`Found header at row ${i}:`, grid[i]);
        headerRowIdx = i;
        break;
    }
}

if (headerRowIdx !== -1) {
    const headers = grid[headerRowIdx].map(v => String(v).replace(/"/g, '').trim());
    const dataRows = grid.slice(headerRowIdx + 1);
    
    const getVal = (rowValues, possibleKeywords) => {
        const idx = headers.findIndex(h => {
            const nh = h.toLowerCase();
            return possibleKeywords.some(k => nh === k || (nh.length > 3 && nh.includes(k)));
        });
        return idx !== -1 ? rowValues[idx] : null;
    };

    const firstRowValues = dataRows[0];
    const name = getVal(firstRowValues, ['instrument', 'stock name', 'name', 'symbol', 'security', 'scrip', 'company']);
    const qty = getVal(firstRowValues, ['qty', 'quantity', 'shares', 'units', 'stock qty', 'balance']);
    const curVal = getVal(firstRowValues, ['cur. val', 'closing', 'current value', 'market value', 'total value', 'invested value', 'buy value', 'ltp']);
    
    console.log(`Result for Row 1 -> Name: ${name}, Qty: ${qty}, Value: ${curVal}`);
    if (name && qty && curVal) console.log("✅ Logic Verified");
    else console.log("❌ Failed to resolve some columns");
} else {
    console.log("❌ Header Signature Not Found");
}
