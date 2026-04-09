import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../supabaseClient';
import { FileUp, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const COLORS = ['#2dd4bf', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981'];

export default function Importer() {
  const [data, setData] = useState([]);
  const [csvType, setCsvType] = useState('none'); // none, stocks, bank, transactions
  const [status, setStatus] = useState('idle'); // idle, parsing, uploading, done, error

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus('parsing');
    setCsvType('none');

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function (results) {
        if (results.data.length === 0) {
           setStatus('error');
           return;
        }

        const headers =
          results.meta.fields || Object.keys(results.data[0]).map((k) => k.toLowerCase());
        const headersStr = headers.join(' ').toLowerCase();

        // 1. Heuristic: Stocks Test
        if (headersStr.includes('instrument') && headersStr.includes('cur. val')) {
          setCsvType('stocks');
          let parsedStocks = results.data.filter(r => r.Instrument && r['Cur. val']).map((row, i) => {
            return {
              name: `${row.Instrument} (${row['Qty.'] || 0} shares)`,
              value: Number(row['Cur. val'] || 0),
              color: COLORS[i % COLORS.length]
            };
          });
          setData(parsedStocks);
        } 
        // 2. Heuristic: Bank Test
        else if (headersStr.includes('balance') && (headersStr.includes('debit') || headersStr.includes('credit') || headersStr.includes('withdrawal'))) {
          setCsvType('bank');
          // Find the last valid balance in the file
          let lastBalance = 0;
          for (let i = results.data.length - 1; i >= 0; i--) {
             let balStr = results.data[i].Balance || results.data[i].balance || '0';
             balStr = balStr.replace(/,/g, '');
             let possibleBal = Number(balStr);
             if (!isNaN(possibleBal) && possibleBal !== 0) {
               lastBalance = possibleBal;
               break;
             }
          }
          // Only show what we are going to import
          setData([{
             name: 'Imported Bank Statement Account',
             type: 'Checking',
             balance: lastBalance
          }]);
        } 
        // 3. Heuristic: Transactions Fallback
        else {
          setCsvType('transactions');
          let parsedTx = results.data.map(row => {
            const amount = Number(row.amount || row.Amount || row.Withdrawal || 0);
            let type = row.type || row.Type || row.type_label;
            if (!type) {
              type = amount < 0 ? 'expense' : 'income'; // default
            }
            return {
              description: row.description || row.Description || row.Narration || 'Imported Tx',
              amount: amount,
              type: type.toLowerCase(),
              date_label: row.date || row.Date || row.date_label || 'Imported'
            };
          });
          setData(parsedTx);
        }

        setStatus('idle');
      },
      error: function() {
        setStatus('error');
      }
    });
  };

  const handleRemoveRow = (index) => {
    setData(data.filter((_, i) => i !== index));
  };

  const handleSyncToSupabase = async () => {
    if (data.length === 0) return;
    setStatus('uploading');
    let errorObj = null;

    if (csvType === 'stocks') {
       const { error } = await supabase.from('assets').insert(data);
       errorObj = error;
    } else if (csvType === 'bank') {
       const { error } = await supabase.from('accounts').insert(data);
       errorObj = error;
    } else if (csvType === 'transactions') {
       const { error } = await supabase.from('transactions').insert(data);
       errorObj = error;
    }

    if (errorObj) {
      console.error(errorObj);
      setStatus('error');
    } else {
      setStatus('done');
      setData([]);
      setCsvType('none');
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Data Importer</h1>
          <p className="text-muted">Smart Auto-Classification for Stocks, Banking & General CSVs.</p>
        </div>
      </div>

      <div className="glass-panel delay-1" style={{ textAlign: 'center', padding: '60px 40px', borderStyle: 'dashed', borderWidth: '2px' }}>
        <FileUp size={48} color="var(--accent-primary)" style={{ margin: '0 auto 20px' }} />
        <h3 style={{ marginBottom: '16px' }}>Upload Statement (.csv)</h3>
        
        <label className="btn btn-primary" style={{ cursor: 'pointer', marginBottom: '24px', padding: '12px 24px', fontSize: '18px' }}>
          Choose CSV File
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        
        {data.length > 0 && status !== 'uploading' && status !== 'done' && (
          <div style={{ marginTop: '20px', padding: '20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', textAlign: 'left' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Preview: 
                <span className="text-success" style={{ marginLeft: '8px' }}>
                  {csvType === 'stocks' && 'Portfolio Assets Detected'}
                  {csvType === 'bank' && 'Bank Account Found'}
                  {csvType === 'transactions' && 'Standard Transactions Detected'}
                </span>
                <span className="text-muted text-sm" style={{marginLeft:'8px'}}>({data.length} records)</span>
              </span>
              <button 
                className="btn btn-primary" 
                onClick={handleSyncToSupabase}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Sync to Supabase
              </button>
            </h3>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                
                {csvType === 'transactions' && (
                  <>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Date</th>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Description</th>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Type</th>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Amount</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px' }}>{row.date_label}</td>
                          <td style={{ padding: '10px' }}>{row.description}</td>
                          <td style={{ padding: '10px', textTransform: 'capitalize' }}>{row.type}</td>
                          <td className={row.amount > 0 ? "text-success" : "text-danger"} style={{ padding: '10px', fontWeight: 600 }}>
                            {row.amount > 0 ? '+' : ''}₹{Math.abs(row.amount).toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <button onClick={() => handleRemoveRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {csvType === 'stocks' && (
                  <>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Asset Name (Ticker & Qty)</th>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Total Current Value</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: row.color }}></div>
                            {row.name}
                          </td>
                          <td className="text-success" style={{ padding: '10px', fontWeight: 600 }}>
                            ₹{row.value.toLocaleString('en-IN')}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            <button onClick={() => handleRemoveRow(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {csvType === 'bank' && (
                  <>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Action</th>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Target Account Record</th>
                        <th style={{ padding: '10px', color: 'var(--text-muted)' }}>Extracted Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '10px', color: 'var(--accent-primary)' }}>Creates New Bank Account</td>
                          <td style={{ padding: '10px' }}>{row.name} ({row.type})</td>
                          <td className={row.balance > 0 ? "text-success" : "text-danger"} style={{ padding: '10px', fontWeight: 600 }}>
                            {row.balance > 0 ? '+' : ''}₹{Math.abs(row.balance).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

              </table>
            </div>
          </div>
        )}

        {status === 'uploading' && <p className="text-muted mt-4">Syncing securely to {csvType === 'stocks' ? 'Portfolio' : csvType === 'bank' ? 'Bank Accounts' : 'Activity'}...</p>}
        
        {status === 'done' && (
          <div style={{ marginTop: '20px', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <CheckCircle size={20} /> Data saved successfully! Check your Dashboard or Navigation links.
          </div>
        )}
        
        {status === 'error' && (
          <div style={{ marginTop: '20px', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <AlertCircle size={20} /> Failed to process CSV or sync to database.
          </div>
        )}
      </div>
    </div>
  );
}

