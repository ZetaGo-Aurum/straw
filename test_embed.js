const undici = require('undici');

async function testEmbed() {
  const url = 'https://www.youtube.com/embed/_4j1Abt_AiM';
  const res = await undici.request(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
    }
  });
  const html = await res.body.text();
  
  const regex = /ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)/;
  const match = html.match(regex);
  if (match) {
    const data = JSON.parse(match[1]);
    const formats = [...(data.streamingData?.formats || []), ...(data.streamingData?.adaptiveFormats || [])];
    console.log('Embed playability:', data.playabilityStatus?.status);
    console.log('Formats found:', formats.length);
  } else {
    console.log('No ytInitialPlayerResponse found in embed HTML');
  }
}

testEmbed();
