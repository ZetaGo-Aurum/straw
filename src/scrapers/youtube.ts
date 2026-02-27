import { StrawClient, StrawClientOptions } from '../core/client';

export interface YouTubeFormats {
    url: string;
    mimeType: string;
    width?: number;
    height?: number;
    quality?: string;
    bitrate?: number;
    hasAudio: boolean;
    hasVideo: boolean;
}

export interface YouTubeResult {
    title: string;
    author: string;
    description: string;
    views: string;
    durationSeconds: string;
    thumbnail: string;
    formats: YouTubeFormats[];
}

export class YouTubeScraper {
    private client: StrawClient;

    constructor(options?: StrawClientOptions) {
        this.client = new StrawClient(options);
    }

    /**
     * Extracts YouTube video metadata and direct stream URLs without external bloatware.
     * Parses the ytInitialPlayerResponse object embedded in the watch HTML.
     */
    public async scrapeVideo(url: string): Promise<YouTubeResult> {
        const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^"&?\/\s]{11})/);
        if (!videoIdMatch || !videoIdMatch[1]) {
            throw new Error('Invalid YouTube URL');
        }
        const videoId = videoIdMatch[1];

        const html = await this.client.getText(url, {
            headers: { 'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430' }
        });
        
        const regex = /ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)/;
        const match = html.match(regex);
        let visitorData = '';
        let details: any = {};
        
        if (match && match[1]) {
            const data = JSON.parse(match[1]);
            details = data?.videoDetails || {};
            visitorData = data?.responseContext?.visitorData || '';
        }
        
        if (!visitorData) {
            const vdMatch = html.match(/"visitorData"\s*:\s*"([^"]+)"/);
            if (vdMatch) visitorData = vdMatch[1];
        }

        const payload = {
            context: {
                client: {
                    hl: 'en',
                    gl: 'US',
                    clientName: 'IOS',
                    clientVersion: '19.28.1',
                    osName: 'iOS',
                    osVersion: '17.5.1',
                    deviceMake: 'Apple',
                    deviceModel: 'iPhone16,2',
                    visitorData: visitorData
                }
            },
            videoId: videoId
        };

        const res = await this.client.request('https://www.youtube.com/youtubei/v1/player', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'com.google.ios.youtube/19.28.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)'
            },
            body: JSON.stringify(payload)
        });

        const apiData = await res.json() as any;
        if (!details.title) {
            details = apiData?.videoDetails || {};
        }
        const streamingData = apiData?.streamingData;

        if (!details) {
            throw new Error('Video details not found inside player response.');
        }

        const formats: YouTubeFormats[] = [];
        const rawFormats = [...(streamingData?.formats || []), ...(streamingData?.adaptiveFormats || [])];
        
        for (const format of rawFormats) {
            if (format.url) {
                const mimeType = format.mimeType || '';
                formats.push({
                    url: format.url,
                    mimeType: mimeType,
                    width: format.width,
                    height: format.height,
                    quality: format.qualityLabel || format.quality,
                    bitrate: format.bitrate,
                    hasAudio: mimeType.includes('audio/'),
                    hasVideo: mimeType.includes('video/')
                });
            } else if (format.signatureCipher) {
                // To avoid bloatware, we do not implement the complex decipher algorithm here.
                // Modern APIs usually provide the URL directly for lower qualities or we can fallback to other APIs.
                // Implementing decipher requires porting youtube-dl's sig logic or using ytdl-core.
                continue;
            }
        }

        return {
            title: details.title || '',
            author: details.author || '',
            description: details.shortDescription || '',
            views: details.viewCount || '0',
            durationSeconds: details.lengthSeconds || '0',
            thumbnail: details.thumbnail?.thumbnails?.[details.thumbnail.thumbnails.length - 1]?.url || '',
            formats
        };
    }
}
