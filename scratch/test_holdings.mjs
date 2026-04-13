
const stockKeywords = ['instrument', 'stock name', 'quantity', 'avg', 'closing'];
const sampleKeys = ["Instrument","Qty.","Avg. cost","LTP","Invested","Cur. val","P&L","Net chg.","Day chg.",""];
const sampleKeysStr = sampleKeys.join(' ').toLowerCase();
const matchCount = stockKeywords.filter(k => sampleKeysStr.includes(k)).length;

console.log('sampleKeysStr:', sampleKeysStr);
console.log('matchCount:', matchCount);

const cleanNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  return Number(cleaned) || 0;
};

const normalizeRow = (row, index, importBroker) => {
  const keys = Object.keys(row);
  const getVal = (possibleHeaders) => {
    const foundKey = keys.find(k => possibleHeaders.includes(k.trim().toLowerCase()));
    return row[foundKey];
  };

  const rawName = getVal(['instrument', 'stock name', 'name', 'symbol', 'security', 'scrip name']);
  const qty = cleanNumber(getVal(['qty.', 'quantity', 'qty', 'shares', 'units']));
  const curVal = cleanNumber(getVal(['cur. val', 'closing value', 'current value', 'market value', 'total value']));
  const buyPrice = cleanNumber(getVal(['avg. cost', 'average buy price', 'buy price', 'average price', 'avg price']));

  if (!rawName) return null;

  return {
    name: `${rawName} (${qty} shares)`,
    value: curVal || 0,
    buy_price: buyPrice || null,
    broker: importBroker
  };
};

const jsonData = [
  {"Instrument":"BDL","Qty.":1,"Avg. cost":1942.8,"LTP":1356.7,"Invested":1942.8,"Cur. val":1356.7,"P&L":-586.1,"Net chg.":-30.17,"Day chg.":5.78,"":""}
];

const parsedAssets = jsonData
  .map((row, i) => normalizeRow(row, i, 'Zerodha'))
  .filter(asset => asset !== null && asset.value > 0);

console.log('parsedAssets:', JSON.stringify(parsedAssets, null, 2));
