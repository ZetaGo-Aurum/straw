const undici = require('undici');

async function testClient(clientName, clientVersion, userAgent, osName='', osVersion='') {
  const payload = {
    context: {
      client: {
        hl: 'en',
        gl: 'US',
        clientName,
        clientVersion,
        osName,
        osVersion
      }
    },
    videoId: '_4j1Abt_AiM'
  };

  const res = await undici.request('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': userAgent
    },
    body: JSON.stringify(payload)
  });

  const body = await res.body.json();
  const formats = [...(body.streamingData?.formats || []), ...(body.streamingData?.adaptiveFormats || [])];
  console.log(`[${clientName}] Playability:`, body.playabilityStatus?.status, '| Formats:', formats.length);
}

async function runAll() {
  await testClient('WEB_EMBED', '1.20230209.00.00', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
  await testClient('TVHTML5', '7.20230209.00.00', 'Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko)');
  await testClient('ANDROID', '17.31.35', 'com.google.android.youtube/17.31.35 (Linux; U; Android 11)', 'Android', '11');
  await testClient('IOS', '19.28.1', 'com.google.ios.youtube/19.28.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)', 'iOS', '17.5.1');
}

runAll();
