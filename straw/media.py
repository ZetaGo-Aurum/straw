import re
from typing import Dict, List, Any
from bs4 import BeautifulSoup
from .client import StrawClient

class MediaScraper:
    def __init__(self, **client_options):
        self.client = StrawClient(**client_options)

    async def extract_media(self, url: str) -> Dict[str, Any]:
        html = await self.client.get_text(url)
        soup = BeautifulSoup(html, 'lxml')

        page_title = soup.title.string.strip() if soup.title and soup.title.string else ""
        media_links = set()

        for tag in soup.find_all(['video', 'audio', 'source', 'img']):
            src = tag.get('src') or tag.get('srcset')
            if src:
                urls = re.findall(r'''https?:\/\/[^\s"',]+''', src)
                for u in urls:
                    media_links.add(u)
                if src.startswith('http') and src not in media_links:
                    media_links.add(src)

        for tag in soup.find_all('a', href=True):
            href = tag.get('href')
            if href and href.startswith('http') and re.search(r'\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|mp4|mp3|webm|wav|ogg|m4a|avi|mkv|mov|flv|png|jpg|jpeg|gif|svg|webp|avif|ico|bmp)(?:\?.*)?$', href, re.IGNORECASE):
                media_links.add(href)

        raw_links = re.findall(r'''https?:\/\/[^\s"',]+\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico|bmp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|mp4|mp3|webm|wav|ogg|m4a|avi|mkv|mov|flv)''', html, re.IGNORECASE)
        for link in raw_links:
            media_links.add(link)

        return {
            'pageTitle': page_title,
            'mediaLinks': list(media_links)
        }
