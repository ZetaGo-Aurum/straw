const fs = require('fs');
const undici = require('undici');

async function extractMetadata() {
  const videoId = '_4j1Abt_AiM';
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  const htmlRes = await undici.request(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0 Safari/537.36',
      'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const html = await htmlRes.body.text();
  const match = html.match(/var ytInitialData\s*=\s*({.*?});(?:<\/script>)/);
  
  if (match) {
    const data = JSON.parse(match[1]);
    fs.writeFileSync('ytInitialData_dump.json', JSON.stringify(data, null, 2));
    console.log('Saved ytInitialData to ytInitialData_dump.json');
    
    // Attempt to drill down to find metadata.
    // Subscribers usually in secondaryResults or owner item
    
  } else {
    console.log('ytInitialData not found!');
  }
}

extractMetadata().catch(console.error);
