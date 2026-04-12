import fs from 'fs';

const filePath = 'src/components/Portfolio.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetLine = '{/* Bollinger Band + Volume */}';
const replacement = `{/* Institutional Flow & HNI */}
                          {deepScrutinyData.institutional && (
                            <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <p style={{ fontSize: '13px', margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>🏦 Institutional Flow & HNI Activity</p>
                                <span style={{ fontSize: '10px', background: 'var(--accent-gradient)', color: '#041014', padding: '2px 8px', borderRadius: '12px', marginLeft: 'auto', fontWeight: 600 }}>PREMIUM</span>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                <div style={{ flex: 1, minWidth: '130px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>FII Sentiment</p>
                                  <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: deepScrutinyData.institutional.fii === 'Bullish' ? '#10b981' : deepScrutinyData.institutional.fii === 'Bearish' ? '#ef4444' : '#eab308' }}>{deepScrutinyData.institutional.fii}</p>
                                </div>
                                <div style={{ flex: 1, minWidth: '130px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>DII Sentiment</p>
                                  <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: deepScrutinyData.institutional.dii === 'Bullish' ? '#10b981' : deepScrutinyData.institutional.dii === 'Bearish' ? '#ef4444' : '#eab308' }}>{deepScrutinyData.institutional.dii}</p>
                                </div>
                                <div style={{ flex: 1.5, minWidth: '180px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 4px', textTransform: 'uppercase' }}>Flow Activity</p>
                                  <p style={{ fontSize: '14px', margin: 0, fontWeight: 600, color: '#fff' }}>{deepScrutinyData.institutional.activity}</p>
                                </div>
                              </div>
                              
                              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5, borderLeft: '3px solid var(--accent-primary)', paddingLeft: '10px' }}>
                                {deepScrutinyData.institutional.description}
                              </p>
                            </div>
                          )}

                          {/* Bollinger Band + Volume */}`;

if (content.includes(targetLine)) {
  content = content.replace(targetLine, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully updated Portfolio.jsx with Institutional Flow UI.');
} else {
  console.log('❌ Could not find target line for replacement.');
}
