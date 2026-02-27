import asyncio
import sys
import os

# Ensure the parent directory is in the path to import 'straw'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from straw import WebScraper, YouTubeScraper, MediaScraper

async def run_tests():
    print("Testing Straw Library (Python)...")
    print("-" * 33)

    try:
        print("1. Testing Web Scraper on example.com...")
        web = WebScraper()
        web_res = await web.scrape("https://example.com")
        print(f"Web Scraper Output: Title = {web_res['title']}")
        print(f"Web Scraper Output: Text = {web_res['text'][:50]}...")
        await web.client.close()

        print("\n" + "-" * 33)

        print("2. Testing YouTube Scraper...")
        yt = YouTubeScraper()
        yt_res = await yt.scrape_video("https://www.youtube.com/watch?v=aqz-KE-bpKQ")
        print(f"YouTube Scraper Output: Title = {yt_res.get('title')}")
        print(f"YouTube Scraper Output: Subscribers = {yt_res.get('subscribers')}")
        print(f"YouTube Scraper Output: Likes = {yt_res.get('likes')}")
        print(f"YouTube Scraper Output: Comments = {yt_res.get('comments')}")
        print(f"YouTube Scraper Output: Duration = {yt_res.get('durationSeconds')} seconds")
        formats = yt_res.get('formats', {})
        print(f"YouTube Scraper Output: Found {len(formats.get('video', []))} video, {len(formats.get('videoOnly', []))} video-only, and {len(formats.get('audio', []))} audio formats")
        await yt.client.close()

        print("\n" + "-" * 33)

        print("3. Testing Media extractor on a public media page...")
        media = MediaScraper()
        media_res = await media.extract_media("https://en.wikipedia.org/wiki/File:Big_Buck_Bunny_4K.webm")
        print(f"Media Scraper Output: Found {len(media_res['mediaLinks'])} media links")
        if len(media_res['mediaLinks']) > 0:
            print(f"Sample Link: {media_res['mediaLinks'][0][:50]}...")
        await media.client.close()

        print("\n" + "-" * 33)
        print("All tests completed successfully!")

    except Exception as e:
        print(f"Test failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    if sys.platform == "win32":
         asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run_tests())
