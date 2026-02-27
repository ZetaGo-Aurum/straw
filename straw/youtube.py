import json
import re
from typing import Dict, List, Any
from .client import StrawClient

class YouTubeScraper:
    def __init__(self, **client_options):
        self.client = StrawClient(**client_options)

    async def scrape_video(self, url: str) -> Dict[str, Any]:
        headers = {
            'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430'
        }
        html = await self.client.get_text(url, headers=headers)

        match = re.search(r'ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)', html)
        if not match:
            raise Exception("ytInitialPlayerResponse not found. YouTube layout changed or IP blocked.")

        data = json.loads(match.group(1))
        details = data.get('videoDetails', {})
        streaming_data = data.get('streamingData', {})

        if not details:
            raise Exception("Video details not found inside player response.")

        formats = []
        raw_formats = streaming_data.get('formats', []) + streaming_data.get('adaptiveFormats', [])

        for f in raw_formats:
            if 'url' in f:
                mime_type = f.get('mimeType', '')
                formats.append({
                    'url': f['url'],
                    'mimeType': mime_type,
                    'width': f.get('width'),
                    'height': f.get('height'),
                    'quality': f.get('qualityLabel') or f.get('quality'),
                    'bitrate': f.get('bitrate'),
                    'hasAudio': 'audio/' in mime_type,
                    'hasVideo': 'video/' in mime_type
                })

        thumbnails = details.get('thumbnail', {}).get('thumbnails', [])
        best_thumbnail = thumbnails[-1]['url'] if thumbnails else ''

        return {
            'title': details.get('title', ''),
            'author': details.get('author', ''),
            'description': details.get('shortDescription', ''),
            'views': details.get('viewCount', '0'),
            'durationSeconds': details.get('lengthSeconds', '0'),
            'thumbnail': best_thumbnail,
            'formats': formats
        }
