import straw from '../src/index';

async function runTests() {
    console.log('Testing Straw Library...');
    console.log('---------------------------------');

    try {
        // 1. Web Scraper Test
        console.log('1. Testing Web Scraper on example.com...');
        const webClient = straw.web();
        const webResult = await webClient.scrape('https://example.com');
        console.log(`Web Scraper Output: Title = ${webResult.title}`);
        console.log(`Web Scraper Output: Text = ${webResult.text.substring(0, 50)}...`);

        console.log('\n---------------------------------');

        // 2. YouTube Scraper Test
        console.log('2. Testing YouTube Scraper...');
        const ytClient = straw.youtube();
        // Use a generic test video like Big Buck Bunny
        const ytResult = await ytClient.scrapeVideo('https://www.youtube.com/watch?v=aqz-KE-bpKQ');
        console.log('YouTube Scraper Output: Title =', ytResult.title);
  console.log('YouTube Scraper Output: Subscribers =', ytResult.subscribers);
  console.log('YouTube Scraper Output: Likes =', ytResult.likes);
  console.log('YouTube Scraper Output: Comments =', ytResult.comments);
  console.log('YouTube Scraper Output: Duration =', ytResult.durationSeconds, 'seconds');
  console.log(`YouTube Scraper Output: Found ${ytResult.formats.video.length} video (combined), ${ytResult.formats.videoOnly.length} video-only, and ${ytResult.formats.audio.length} audio formats.`);

        console.log('\n---------------------------------');

        // 3. Media Scraper Test
        console.log('3. Testing Media extractor on a public media page (using a wikipedia sample file page)...');
        const mediaClient = straw.media();
        const mediaResult = await mediaClient.extractMedia('https://en.wikipedia.org/wiki/File:Big_Buck_Bunny_4K.webm');
        console.log(`Media Scraper Output: Found ${mediaResult.mediaLinks.length} media links`);
        if (mediaResult.mediaLinks.length > 0) {
            console.log(`Sample Link: ${mediaResult.mediaLinks[0].substring(0, 50)}...`);
        }

        console.log('\n---------------------------------');
        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

runTests();
