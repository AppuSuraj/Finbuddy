import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';
import { FileUp, CheckCircle, AlertCircle, Trash2, FileText, LayoutGrid } from 'lucide-react';

const COLORS = ['#2dd4bf', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981'];

export default function Importer({ session, onImportComplete }) {
  const [data, setData] = useState([]);
  const [csvType, setCsvType] = useState('none'); // none, stocks, bank, transactions
  const [status, setStatus] = useState('idle'); // idle, parsing, uploading, done, error
  const [importBroker, setImportBroker] = useState('Zerodha');

  const cleanNumber = (val) => {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^0-9.-]/g, '');
    return Number(cleaned) || 0;
  };

  const smartResolveTicker = (rawName) => {
    if (!rawName) return '';
    let name = String(rawName).toUpperCase().trim();
    
    // Pattern: Removing common corporate suffixes
    const suffixes = [' LTD', ' LIMITED', ' CORP', ' INC', ' REITY', ' INFRA', ' CO', ' CORP', ' INDUSTRIES', ' SERVICES', ' ENTERPRISES'];
    suffixes.forEach(s => {
      if (name.endsWith(s)) name = name.substring(0, name.lastIndexOf(s)).trim();
    });

    // Handle common mappings that don't match exactly
    const mappings = {
      'HDFC BANK': 'HDFCBANK',
      'TATA POWER': 'TATAPOWER',
      'KOTAK MAHINDRA BANK': 'KOTAKBANK',
      'ICICI BANK': 'ICICIBANK',
      'ADANI ENTERPRISES': 'ADANIENT',
      'ADANI PORTS AND SPECIAL ECONOMIC ZONE': 'ADANIPORTS',
      'ADANI PORTS': 'ADANIPORTS',
      'TATA CONSULTANCY SERVICES': 'TCS',
      'MAHINDRA & MAHINDRA': 'M&M',
      'LARSEN & TOUBRO': 'LT',
      'RELIANCE INDUSTRIES': 'RELIANCE',
      'STATE BANK OF INDIA': 'SBIN',
      'HOUSING DEVELOPMENT FINANCE CORP': 'HDFC',
      'AXIS BANK': 'AXISBANK',
      'BAJAJ FINANCE': 'BAJFINANCE',
      'BHARTI AIRTEL': 'BHARTIARTL',
      'POWER GRID CORP OF INDIA': 'POWERGRID',
      'ULTRATECH CEMENT': 'ULTRACEMCO',
      'SUN PHARMACEUTICAL INDUSTRIES': 'SUNPHARMA',
      'HINDUSTAN UNILEVER': 'HINDUNILVR'
    };

    if (mappings[name]) return mappings[name];

    // Fallback: Remove special chars and spaces
    return name.split(' ')[0].replace(/[^A-Z0-9&]/g, '');
  };

  const normalizeRow = (row, index) => {
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

    const ticker = smartResolveTicker(rawName);

    return {
      name: `${ticker} (${qty} shares)`,
      value: curVal || 0,
      buy_price: buyPrice || null,
      color: COLORS[index % COLORS.length],
      broker: importBroker // Use current selected broker
    };
  };

  const processData = (jsonData, detectedExtension) => {
    if (!jsonData || jsonData.length === 0) {
      setStatus('error');
      return;
    }

    // Auto-detect broker based on headers
    const sampleKeysStr = Object.keys(jsonData[0]).join(' ').toLowerCase();
    if (sampleKeysStr.includes('stock name')) setImportBroker('Groww');
    else if (sampleKeysStr.includes('instrument')) setImportBroker('Zerodha');
    else if (detectedExtension === 'xlsx') setImportBroker('Groww');

    // Attempt to find a row that looks like a header if the first row fails normalization logic
    const stockKeywords = ['instrument', 'stock name', 'quantity', 'avg', 'closing'];
    const matchCount = stockKeywords.filter(k => sampleKeysStr.includes(k)).length;

    let finalRows = jsonData;
    if (matchCount < 2) {
      for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
        const rowValues = Object.values(jsonData[i]).map(v => String(v).toLowerCase());
        const rowMatchCount = stockKeywords.filter(k => rowValues.some(rv => rv.includes(k))).length;
        if (rowMatchCount >= 2) {
          const headers = Object.values(jsonData[i]);
          finalRows = jsonData.slice(i + 1).map(r => {
            const obj = {};
            Object.values(r).forEach((v, idx) => { if (headers[idx]) obj[headers[idx]] = v; });
            return obj;
          });
          break;
        }
      }
    }

    const parsedAssets = finalRows
      .map((row, i) => normalizeRow(row, i))
      .filter(asset => asset !== null && asset.value > 0);

    if (parsedAssets.length > 0) {
      setCsvType('stocks');
      setData(parsedAssets);
    } else {
      setStatus('error');
    }
    setStatus('idle');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('parsing');
    setCsvType('none');

    const fileExt = file.name.split('.').pop().toLowerCase();

    if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
          processData(results.data, 'csv');
        },
        error: function() { setStatus('error'); }
      });
    } else if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const objects = data.map(row => {
          const obj = {};
          row.forEach((cell, idx) => { obj[`col_${idx}`] = cell; });
          return obj;
        });
        processData(objects, 'xlsx');
      };
      reader.onerror = () => setStatus('error');
      reader.readAsBinaryString(file);
    } else {
      setStatus('error');
    }
  };

  // When broker toggle changes in preview, update all data
  const handleBrokerChange = (newBroker) => {
    setImportBroker(newBroker);
    setData(prev => prev.map(row => ({ ...row, broker: newBroker })));
  };

  const handleRemoveRow = (index) => {
    setData(data.filter((_, i) => i !== index));
  };

  const handleSyncToSupabase = async () => {
    if (data.length === 0) return;
    setStatus('uploading');
    
    const dataWithUser = data.map(item => ({
      ...item,
      user_id: session.user.id
    }));

    const { error } = await supabase.from('assets').insert(dataWithUser);

    if (error) {
      console.error(error);
      setStatus('error');
    } else {
      setStatus('done');
      setData([]);
      setCsvType('none');
      if (onImportComplete) onImportComplete();
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Smart Importer 2.0</h1>
          <p className="text-muted">High-fidelity multi-broker data ingestion engine.</p>
        </div>
      </div>

      <div className="glass-panel delay-1" style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--accent-primary)', background: 'rgba(45, 212, 191, 0.05)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '16px' }}>
          <LayoutGrid size={20} /> Smart Import Guide
        </h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
          Upload your **Holdings Report**. We automatically extracttickers and values. If you've already imported some stocks, this will add to your existing portfolio.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
            <p style={{ fontSize: '11px', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Zerodha (CSV)</p>
            <p style={{ fontSize: '12px', opacity: 0.7, fontFamily: 'monospace' }}>Instrument, Qty., Cur. val</p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
            <p style={{ fontSize: '11px', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>Groww (Excel)</p>
            <p style={{ fontSize: '12px', opacity: 0.7, fontFamily: 'monospace' }}>Stock Name, Quantity, Closing value</p>
          </div>
        </div>
      </div>

      <div className="glass-panel delay-1" style={{ textAlign: 'center', padding: '60px 40px', borderStyle: 'dashed', borderWidth: '2px' }}>
        <FileUp size={48} color="var(--accent-primary)" style={{ margin: '0 auto 20px' }} />
        <h3 style={{ marginBottom: '16px' }}>Upload Statement</h3>
        <p className="text-muted" style={{ fontSize: '14px', marginBottom: '24px' }}>Drag and drop your .csv or .xlsx file here</p>
        
        <label className="btn btn-primary" style={{ cursor: 'pointer', marginBottom: '24px', padding: '12px 24px', fontSize: '18px' }}>
          Choose File
          <input 
            type="file" 
            accept=".csv,.xlsx,.xls" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        
        {data.length > 0 && status !== 'uploading' && status !== 'done' && (
          <div style={{ marginTop: '20px', padding: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} color="var(--accent-primary)" />
                  Preview Assets 
                  <span className="text-muted text-sm" style={{marginLeft:'8px'}}>({data.length} holdings)</span>
                </h3>
              </div>
              
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
                {['Zerodha', 'Groww'].map(b => (
                  <button 
                    key={b}
                    onClick={() => handleBrokerChange(b)}
                    style={{ 
                      padding: '6px 16px', borderRadius: '8px', fontSize: '12px', border: 'none', cursor: 'pointer',
                      background: importBroker === b ? b === 'Zerodha' ? '#0ea5e9' : '#10b981' : 'transparent',
                      color: importBroker === b ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontWeight: 600, transition: 'all 0.2s'
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>

              <button 
                className="btn btn-primary" 
                onClick={handleSyncToSupabase}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Sync to My Portfolio
              </button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Asset Details (Market Resolved)</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Purchase Price</th>
                    <th style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase' }}>Market Value</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ minWidth: '8px', height: '8px', borderRadius: '50%', background: row.color }}></div>
                        <span style={{ fontWeight: 500, fontSize: '14px' }}>{row.name}</span>
                        <span style={{ fontSize: '10px', background: row.broker === 'Zerodha' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.15)', color: row.broker === 'Zerodha' ? '#0ea5e9' : '#10b981', padding: '1px 6px', borderRadius: '6px', fontWeight: 600 }}>{row.broker}</span>
                      </td>
                      <td style={{ padding: '14px 10px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                        {row.buy_price ? `₹${row.buy_price.toLocaleString('en-IN')}` : 'N/A'}
                      </td>
                      <td className="text-success" style={{ padding: '14px 10px', fontWeight: 600, fontSize: '14px' }}>
                        ₹{row.value.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                        <button onClick={() => handleRemoveRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', opacity: 0.6 }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {status === 'uploading' && <div style={{ padding: '40px', textAlign: 'center' }}>
          <LayoutGrid size={32} className="spin" style={{ margin: '0 auto 16px', color: 'var(--accent-primary)' }} />
          <p className="text-muted">Encrypting and syncing your assets securely...</p>
        </div>}
        
        {status === 'done' && (
          <div style={{ marginTop: '20px', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '12px' }}>
            <CheckCircle size={20} /> Portfolio Imported Successfully! Syncing with live market data now.
          </div>
        )}
        
        {status === 'error' && (
          <div style={{ marginTop: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '12px' }}>
            <AlertCircle size={20} /> Unrecognized format. Please ensure headers like "Instrument" or "Stock Name" are present.
          </div>
        )}
      </div>
    </div>
  );
}
