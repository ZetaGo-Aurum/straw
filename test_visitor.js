const undici = require('undici');

async function testVisitor() {
  const videoId = '_4j1Abt_AiM';
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  
  const htmlRes = await undici.request(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0 Safari/537.36',
      'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430'
    }
  });

  const html = await htmlRes.body.text();
  
  let visitorData = '';
  const match = html.match(/"visitorData"\s*:\s*"([^"]+)"/);
  if (match) visitorData = match[1];
  
  console.log('Got Visitor Data:', visitorData);

  const payload = {
    context: {
      client: {
        hl: 'en',
        gl: 'US',
        clientName: 'IOS',
        clientVersion: '19.28.1',
        osName: 'iOS',
        osVersion: '17.5.1',
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        visitorData: visitorData
      }
    },
    videoId: videoId
  };

  const res = await undici.request('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'com.google.ios.youtube/19.28.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)'
    },
    body: JSON.stringify(payload)
  });

  const body = await res.body.json();
  const formats = [...(body.streamingData?.formats || []), ...(body.streamingData?.adaptiveFormats || [])];
  
  console.log('Target Playability:', body.playabilityStatus?.status);
  console.log('Target Formats:', formats.length);
}

testVisitor();
