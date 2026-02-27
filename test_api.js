const undici = require('undici');

async function testInnerTube() {
  const videoId = '_4j1Abt_AiM';
  
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
        deviceModel: 'iPhone16,2'
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
  console.log('Full JSON Response Keys:', Object.keys(body));
  console.log('Raw JSON String (Truncated):', JSON.stringify(body).slice(0, 1000));
  console.log('Playability:', body.playabilityStatus);
  console.log('Title:', body.videoDetails?.title);
  
  const formats = [...(body.streamingData?.formats || []), ...(body.streamingData?.adaptiveFormats || [])];
  console.log('Total Formats:', formats.length);
  
}

testInnerTube();
