const fs = require('fs');
const path = require('path');
const { request } = require('undici');
const straw = require('./dist/index.js');

async function downloadHD() {
  const yt = new straw.YouTubeScraper();
  
  console.log('⏳ Mengekstrak data dan direct link...');
  const res = await yt.scrapeVideo('https://youtu.be/_4j1Abt_AiM?si=5HIa7FnZ1NsV-l-e');
  
  let target = res.formats.videoOnly.sort((a, b) => (b.height || 0) - (a.height || 0))[0];
  if (!target) return console.log('❌ Tidak ada format video yang ditemukan.');
  
  console.log(`✅ Video ditemukan! Resolusi: ${target.width}x${target.height}`);
  
  const folderPath = path.join(process.cwd(), 'download test');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);

  const cleanTitle = res.title.replace(/[\/\\?%*:|"<>]/g, '-');
  const extension = target.mimeType.includes('mp4') ? '.mp4' : '.webm';
  const outPath = path.join(folderPath, `${cleanTitle}_UNDICI_CHUNKED${extension}`);
  const outStream = fs.createWriteStream(outPath);
  
  console.log(`\n⬇️ Memulai proses download...`);
  
  // Ambil contentLength langsung dari format json
  let contentLength = parseInt(target.contentLength || target.approxDurationMs ? (target.bitrate * target.approxDurationMs / 8000).toString() : '0', 10);
  
  // Jika 0, kita coba nge-ping headers nya tapi gapapa kalo gagal
  if (!contentLength) {
     try {
       const headRes = await request(target.url, { method: 'HEAD', headers: {'User-Agent': 'com.google.ios.youtube/19.28.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)'} });
       contentLength = parseInt(headRes.headers['content-length'] || '0', 10);
     } catch (e) {}
  }

  let downloaded = 0;
  const chunkSize = 2 * 1024 * 1024; // 2MB chunk
  
  while (true) {
    let rangeHeader = `bytes=${downloaded}-`;
    if (contentLength && contentLength > 0) {
        const end = Math.min(downloaded + chunkSize - 1, contentLength - 1);
        rangeHeader = `bytes=${downloaded}-${end}`;
    } else {
        rangeHeader = `bytes=${downloaded}-${downloaded + chunkSize - 1}`;
    }

    try {
        const chunkRes = await request(target.url, {
          method: 'GET',
          headers: {
            'Range': rangeHeader,
            'User-Agent': 'com.google.ios.youtube/19.28.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)',
            'Accept': '*/*, text/plain, application/json'
          }
        });

        if (chunkRes.statusCode !== 206 && chunkRes.statusCode !== 200) {
          console.log(`\n❌ Error fetch chunk: HTTP ${chunkRes.statusCode}`);
          break;
        }

        const chunkBuffer = await chunkRes.body.arrayBuffer();
        const buffer = Buffer.from(chunkBuffer);
        
        if (buffer.length === 0) break;
        
        outStream.write(buffer);
        downloaded += buffer.length;
        
        process.stdout.write(`\r🔄 Mendownload: ${(downloaded / 1024 / 1024).toFixed(2)} MB ${contentLength ? '/ ~' + (contentLength / 1024 / 1024).toFixed(2) + ' MB' : ''}`);

        if (buffer.length < chunkSize) break; // End of file
        if (contentLength && downloaded >= contentLength) break;

    } catch (e) {
        console.log(`\n❌ Network Error during chunk request: ${e.message}`);
        break;
    }
  }
  
  outStream.end();
  console.log(`\n\n🎉 Download Selesai! File disimpan di: ${outPath}`);
}

downloadHD().catch(console.error);
