const symbol = 'HAL.NS';
const cleanTicker = symbol.split('.')[0];
const screenerUrl = `https://www.screener.in/company/${cleanTicker}/`;

console.log(`Searching Screener for: ${cleanTicker} at ${screenerUrl}`);

async function test() {
  try {
    const response = await fetch(screenerUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    
    console.log(`Response Status: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      // Regex to pull Industry title text
      const industryMatch = html.match(/title="Industry">(.*?)<\/a>/i);
      const sectorMatch = html.match(/title="Sector">(.*?)<\/a>/i);
      
      console.log('Industry Match:', industryMatch ? industryMatch[1] : 'NOT FOUND');
      console.log('Sector Match:', sectorMatch ? sectorMatch[1] : 'NOT FOUND');
      
      const targetStr = (industryMatch ? industryMatch[1] : (sectorMatch ? sectorMatch[1] : '')).trim();
      console.log('Target String:', targetStr);
    } else {
      console.log('Failed to fetch Screener. Status:', response.status);
    }
  } catch (e) {
    console.error('Error:', e.message);
    if (e.message.includes('fetch is not defined')) {
      console.log('SUGGESTION: Node.js version is too old for native fetch. Need to use "https" module or update Node.');
    }
  }
}

test();
