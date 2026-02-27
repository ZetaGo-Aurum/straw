const undici = require('undici');

async function testVR() {
  const payload = {
    context: {
      client: {
        clientName: 'ANDROID_TESTSUITE',
        clientVersion: '1.9',
        androidSdkVersion: 30,
        hl: 'en',
        gl: 'US',
        utcOffsetMinutes: 0
      }
    },
    videoId: '_4j1Abt_AiM'
  };
  const res = await undici.request('https://www.youtube.com/youtubei/v1/player', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'com.google.android.youtube/17.31.35 (Linux; U; Android 11)' },
    body: JSON.stringify(payload)
  });
  const body = await res.body.json();
  const formats = [...(body.streamingData?.formats || []), ...(body.streamingData?.adaptiveFormats || [])];
  console.log('Playability:', body.playabilityStatus?.status);
  console.log('Formats:', formats.length);
}
testVR();
