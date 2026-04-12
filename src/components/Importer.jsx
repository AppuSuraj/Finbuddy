import { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../supabaseClient';
import { FileUp, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';

const COLORS = ['#2dd4bf', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#10b981'];

export default function Importer({ session }) {
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

        // Strict Heuristic: Portfolio Stocks
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
        } else {
          setStatus('error');
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
       // Inject user_id into each object so multi-tenancy works
       const dataWithUser = data.map(item => ({
          ...item,
          user_id: session.user.id
       }));
       const { error } = await supabase.from('assets').insert(dataWithUser);
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
        <div>
          <h1 style={{ fontSize: '36px', marginBottom: '8px' }}>Smart Importer</h1>
          <p className="text-muted">High-fidelity classification for Stocks & Portfolio Data.</p>
        </div>
      </div>

      {/* New User Onboarding Guide */}
      <div className="glass-panel delay-1" style={{ marginBottom: '24px', padding: '24px', border: '1px solid var(--accent-primary)', background: 'rgba(45, 212, 191, 0.05)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', marginBottom: '16px' }}>
          <CheckCircle size={20} /> New User Guide: How to Import
        </h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
          To automatically categorize your stocks, upload a **CSV file** with the following column headers. Most brokers (like Zerodha, Upstox, or Groww) provide this in your "Holdings" or "Portfolio" report.
        </p>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px' }}>
          Instrument, Qty., Cur. val<br/>
          RELIANCE, 10, 25000<br/>
          HDFCBANK, 50, 75000<br/>
          TCS, 5, 20000
        </div>
        <p style={{ fontSize: '12px', marginTop: '12px', opacity: 0.8 }}>
          *Note: Ensure "Instrument" contains the stock symbol (e.g. RELIANCE) so the AI can find the sector.
        </p>
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
                  {csvType === 'stocks' && 'Portfolio Assets Detected'}
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

