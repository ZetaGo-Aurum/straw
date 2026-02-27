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
        const html = await this.client.getText(url, {
            headers: {
                'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430'
            }
        });
        
        // Find ytInitialPlayerResponse JSON fragment in the HTML
        const regex = /ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)/;
        const match = html.match(regex);
        
        if (!match || !match[1]) {
            throw new Error('ytInitialPlayerResponse not found. YouTube might have changed their layout or the IP is blocked.');
        }

        const data = JSON.parse(match[1]);
        const details = data?.videoDetails;
        const streamingData = data?.streamingData;

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
