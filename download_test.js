const fs = require('fs');
const { fetch } = require('undici');
const straw = require('./dist/index.js');

async function download() {
  const yt = new straw.YouTubeScraper();
  console.log('Scraping metadata and direct links...');
  const res = await yt.scrapeVideo('https://youtu.be/_4j1Abt_AiM?si=_dA2lroz096f1cYp');
  
  // Find a combined video+audio format, or fallback to the highest quality video format
  const combined = res.formats.find(f => f.hasVideo && f.hasAudio);
  const bestVideo = res.formats.filter(f => f.hasVideo).sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  
  const target = combined || bestVideo;
  
  if (!target) {
    console.log('No suitable downloadable format found.');
    return;
  }
  
  console.log(`Downloading: ${res.title}`);
  console.log(`Format: ${target.mimeType} (${target.width || 'unknown'}x${target.height || 'unknown'})`);
  
  // To avoid buffering the whole video in memory, we stream it to the file
  const outPath = 'downloaded_video.mp4';
  const outStream = fs.createWriteStream(outPath);
  
  console.log('Initiating download stream...');
  const response = await fetch(target.url);
  if (!response.body) throw new Error('No response body');
  
  const reader = response.body.getReader();
  let downloaded = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    outStream.write(value);
    downloaded += value.length;
    process.stdout.write(`\rDownloaded: ${(downloaded / 1024 / 1024).toFixed(2)} MB`);
  }
  outStream.end();
  console.log(`\nDownload complete! Saved to ${outPath}`);
}

download().catch(console.error);
