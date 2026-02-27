from typing import Dict, List, Optional, Any
from bs4 import BeautifulSoup
from .client import StrawClient

class WebScraper:
    def __init__(self, **client_options):
        self.client = StrawClient(**client_options)

    async def scrape(self, url: str) -> Dict[str, Any]:
        html = await self.client.get_text(url)
        soup = BeautifulSoup(html, 'lxml')

        title = soup.title.string.strip() if soup.title and soup.title.string else ""
        
        description = ""
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if desc_tag and desc_tag.get('content'):
            description = desc_tag['content']
            
        if not description:
            og_desc = soup.find('meta', attrs={'property': 'og:description'})
            if og_desc and og_desc.get('content'):
                description = og_desc['content']

        meta_tags = {}
        for tag in soup.find_all('meta'):
            name = tag.get('name') or tag.get('property')
            content = tag.get('content')
            if name and content:
                meta_tags[name] = content

        links = []
        for tag in soup.find_all('a', href=True):
            href = tag.get('href', '')
            text = tag.get_text(strip=True)
            if href.startswith('http'):
                links.append({'text': text, 'href': href})

        # Remove scripts and styles
        for tag in soup(['script', 'style', 'noscript', 'iframe', 'svg']):
            tag.decompose()
            
        text_content = ' '.join(soup.get_text(separator=' ').split())

        return {
            'title': title,
            'description': description,
            'text': text_content,
            'links': links,
            'meta': meta_tags
        }
