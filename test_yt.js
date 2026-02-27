const straw = require('./dist/index.js');

async function run() {
  console.time('YouTube Scrape');
  const yt = new straw.YouTubeScraper();
  try {
    const res = await yt.scrapeVideo('https://youtu.be/_4j1Abt_AiM?si=qJY_gv4F_adBYMYP');
    console.log('Title:', res.title);
    console.log('Formats:', res.formats.length);
    console.log('First format URL (truncated):', res.formats[0]?.url?.substring(0, 100));
  } catch (e) {
    console.error('Scrape failed:', e);
  }
  console.timeEnd('YouTube Scrape');
}

run();
