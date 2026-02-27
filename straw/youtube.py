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

        headers = {'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430', 'Accept-Language': 'en-US,en;q=0.9'}
        html = await self.client.get_text(url, headers=headers)
        
        visitor_data = ""
        details = {}
        initial_data = {}
        
        player_match = re.search(r'ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)', html)
        if player_match:
            try:
                data_html = json.loads(player_match.group(1))
                details = data_html.get('videoDetails', {})
                visitor_data = data_html.get('responseContext', {}).get('visitorData', '')
            except:
                pass
                
        data_match = re.search(r'var ytInitialData\s*=\s*({.*?});(?:<\/script>)', html)
        if data_match:
            try:
                initial_data = json.loads(data_match.group(1))
            except:
                pass
            
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

        subscribers = ""
        likes = ""
        comments = ""
        
        try:
            contents = initial_data.get('contents', {}).get('twoColumnWatchNextResults', {}).get('results', {}).get('results', {}).get('contents', [])
            for c in contents:
                sec_info = c.get('videoSecondaryInfoRenderer')
                if sec_info:
                    stext = sec_info.get('owner', {}).get('videoOwnerRenderer', {}).get('subscriberCountText', {}).get('simpleText')
                    if stext: subscribers = stext

            panels = initial_data.get('engagementPanels', [])
            for p in panels:
                sr = p.get('engagementPanelSectionListRenderer', {})
                if sr.get('targetId') == 'engagement-panel-structured-description':
                    items = sr.get('content', {}).get('structuredDescriptionContentRenderer', {}).get('items', [])
                    for i in items:
                        factoids = i.get('videoDescriptionHeaderRenderer', {}).get('factoid', [])
                        for f in factoids:
                            acc = f.get('factoidRenderer', {}).get('accessibilityText', '')
                            if 'like' in acc.lower():
                                likes = acc
                                
                if sr.get('panelIdentifier') == 'engagement-panel-comments-section':
                    runs = sr.get('header', {}).get('engagementPanelTitleHeaderRenderer', {}).get('contextualInfo', {}).get('runs', [])
                    if runs:
                        comments = runs[0].get('text', '')
        except:
            pass

        video_combined = []
        video_only = []
        audio_only = []
        
        raw_formats = streaming_data.get('formats', []) + streaming_data.get('adaptiveFormats', [])

        for f in raw_formats:
            if 'url' in f:
                mime_type = f.get('mimeType', '')
                has_audio = 'audio/' in mime_type
                has_video = 'video/' in mime_type
                
                f_obj = {
                    'url': f['url'],
                    'mimeType': mime_type,
                    'width': f.get('width'),
                    'height': f.get('height'),
                    'quality': f.get('qualityLabel') or f.get('quality'),
                    'bitrate': f.get('bitrate'),
                    'hasAudio': has_audio,
                    'hasVideo': has_video
                }
                
                if has_video and has_audio:
                    video_combined.append(f_obj)
                elif has_video:
                    video_only.append(f_obj)
                elif has_audio:
                    audio_only.append(f_obj)

        thumbnails = details.get('thumbnail', {}).get('thumbnails', [])
        best_thumbnail = thumbnails[-1]['url'] if thumbnails else ''

        return {
            'title': details.get('title', ''),
            'author': details.get('author', ''),
            'subscribers': subscribers,
            'description': details.get('shortDescription', ''),
            'views': details.get('viewCount', '0'),
            'likes': likes,
            'comments': comments,
            'durationSeconds': details.get('lengthSeconds', '0'),
            'thumbnail': best_thumbnail,
            'formats': {
                'video': video_combined,
                'videoOnly': video_only,
                'audio': audio_only
            }
        }
