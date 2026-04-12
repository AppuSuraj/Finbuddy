import fs from 'fs';

const filePath = 'src/components/Portfolio.jsx';
let content = fs.readFileSync(filePath, 'utf8');

const targetLine = '<p style={{ fontSize: \'13px\', color: \'rgba(255,255,255,0.5)\', marginBottom: \'20px\', lineHeight: 1.6 }}>{deepScrutinyData.trendDesc}</p>';
const replacement = `                          <div style={{ padding: '16px', background: 'rgba(45,212,191,0.06)', borderRadius: '12px', marginBottom: '20px', border: '1px solid rgba(45,212,191,0.15)' }}>
                            <p style={{ fontSize: '14px', color: '#fff', margin: '0 0 10px', lineHeight: '1.5', fontWeight: 500 }}>
                              {getScrutinySummary(deepScrutinyData).main}
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {getScrutinySummary(deepScrutinyData).tags.map((tag, i) => (
                                <p key={i} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--accent-primary)' }} /> {tag}
                                </p>
                              ))}
                            </div>
                          </div>`;

if (content.includes(targetLine)) {
  content = content.replace(targetLine, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully updated Portfolio.jsx with Analyst Summary box.');
} else {
  console.log('❌ Could not find target line for replacement.');
}
