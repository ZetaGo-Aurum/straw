const { StrawClient } = require('./dist/core/client.js');

async function test() {
  const client = new StrawClient();
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
    videoId: '_4j1Abt_AiM'
  };

  const res = await client.request('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.ios.youtube/19.28.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  console.log(Object.keys(data));
  if (data.playabilityStatus) {
    console.log('Playability:', data.playabilityStatus);
  }
}

test();
