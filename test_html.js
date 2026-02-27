const undici = require('undici');

async function testHtml() {
  const url = 'https://www.youtube.com/watch?v=_4j1Abt_AiM';
  const res = await undici.request(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430'
    }
  });

  const html = await res.body.text();
  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)/);
  if (match) {
    const data = JSON.parse(match[1]);
    const formats = [...(data.streamingData?.formats || []), ...(data.streamingData?.adaptiveFormats || [])];
    console.log('Got HTML Response with Player:', data.playabilityStatus?.status);
    console.log('Formats:', formats.length);
  } else {
    console.log('No ytInitialPlayerResponse found in direct HTML fetching.');
  }
}

testHtml();
