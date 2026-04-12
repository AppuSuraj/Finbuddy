
const fuzzyMatch = (header, keywords) => {
    if (!header) return false;
    const h = String(header).trim().toLowerCase();
    return keywords.some(k => {
        const kw = k.toLowerCase();
        return h.includes(kw) || kw.includes(h);
    });
};

const getVal = (headers, rowValues, possibleKeywords) => {
    const idx = headers.findIndex(h => fuzzyMatch(h, possibleKeywords));
    return idx !== -1 ? rowValues[idx] : null;
};

// Test Cases
const tests = [
    {
        name: "Zerodha CSV Format",
        headers: ["Instrument", "Qty.", "Avg. cost", "LTP", "Cur. val", "P&L", "Net chg.", "Day chg."],
        row: ["RELIANCE", "10", "2500", "2600", "26000", "1000", "5%", "1%"]
    },
    {
        name: "Groww Excel Format",
        headers: ["Stock Name", "ISIN", "Quantity", "Average Buy Price", "Closing price", "Invested Value", "Current Value"],
        row: ["HDFC BANK", "INE040A01034", "50", "1450", "1600", "72500", "80000"]
    },
    {
        name: "Generic Symbol Format",
        headers: ["Symbol", "Shares", "Purchase Price", "Market Value"],
        row: ["TCS", "5", "3200", "17500"]
    }
];

const nameKeywords = ['instrument', 'stock name', 'name', 'symbol', 'scrip'];
const qtyKeywords = ['qty', 'quantity', 'shares', 'units'];
const curValKeywords = ['cur. val', 'closing', 'current value', 'market value', 'total value', 'ltp'];
const buyPriceKeywords = ['avg', 'average', 'buy price', 'cost', 'purchase'];

tests.forEach(t => {
    console.log(`--- Testing ${t.name} ---`);
    const name = getVal(t.headers, t.row, nameKeywords);
    const qty = getVal(t.headers, t.row, qtyKeywords);
    const curVal = getVal(t.headers, t.row, curValKeywords);
    const buyPrice = getVal(t.headers, t.row, buyPriceKeywords);
    
    console.log(`Resolved -> Name: ${name}, Qty: ${qty}, Value: ${curVal}, Buy: ${buyPrice}`);
    if (name && qty && curVal) {
        console.log("✅ Success\n");
    } else {
        console.log("❌ Failed\n");
    }
});
