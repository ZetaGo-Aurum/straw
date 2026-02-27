import json
import re
from typing import Dict, List, Any
from .client import StrawClient

class YouTubeScraper:
    def __init__(self, **client_options):
        self.client = StrawClient(**client_options)

    async def scrape_video(self, url: str) -> Dict[str, Any]:
        match = re.search(r'(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})', url)
        if not match:
            raise Exception("Invalid YouTube URL")
        video_id = match.group(1)

        headers = {'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430'}
        html = await self.client.get_text(url, headers=headers)
        
        visitor_data = ""
        details = {}
        
        player_match = re.search(r'ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)', html)
        if player_match:
            data_html = json.loads(player_match.group(1))
            details = data_html.get('videoDetails', {})
            visitor_data = data_html.get('responseContext', {}).get('visitorData', '')
            
        if not visitor_data:
            vd_match = re.search(r'"visitorData"\s*:\s*"([^"]+)"', html)
            if vd_match:
                visitor_data = vd_match.group(1)

        payload = {
            "context": {
                "client": {
                    "hl": "en",
                    "gl": "US",
                    "clientName": "IOS",
                    "clientVersion": "19.28.1",
                    "osName": "iOS",
                    "osVersion": "17.5.1",
                    "deviceMake": "Apple",
                    "deviceModel": "iPhone16,2",
                    "visitorData": visitor_data
                }
            },
            "videoId": video_id
        }

        api_headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'com.google.ios.youtube/19.28.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)'
        }

        response = await self.client.request('POST', 'https://www.youtube.com/youtubei/v1/player', json=payload, headers=api_headers)
        api_data = response.json()
        
        if not details.get('title'):
            details = api_data.get('videoDetails', {})
            
        streaming_data = api_data.get('streamingData', {})

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
