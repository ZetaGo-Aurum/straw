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
    subscribers: string;
    description: string;
    views: string;
    likes: string;
    comments: string;
    durationSeconds: string;
    thumbnail: string;
    formats: {
        video: YouTubeFormats[];
        videoOnly: YouTubeFormats[];
        audio: YouTubeFormats[];
    };
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
            headers: { 'Cookie': 'CONSENT=YES+cb.20230501-14-p0.en+FX+430', 'Accept-Language': 'en-US,en;q=0.9' }
        });
        
        const regex = /ytInitialPlayerResponse\s*=\s*({.*?});(?:var|<\/script>)/;
        const match = html.match(regex);
        let visitorData = '';
        let details: any = {};
        
        let initialData: any = {};
        const dataMatch = html.match(/var ytInitialData\s*=\s*({.*?});(?:<\/script>)/);
        if (dataMatch && dataMatch[1]) {
            try { initialData = JSON.parse(dataMatch[1]); } catch(e) {}
        }
        
        let htmlStreamingData: any = {};
        
        if (match && match[1]) {
            const data = JSON.parse(match[1]);
            details = data?.videoDetails || {};
            visitorData = data?.responseContext?.visitorData || '';
            htmlStreamingData = data?.streamingData || {};
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

        let subscribers = '';
        let likes = '';
        let comments = '';

        try {
            const secInfo = initialData?.contents?.twoColumnWatchNextResults?.results?.results?.contents?.find((c: any) => c.videoSecondaryInfoRenderer)?.videoSecondaryInfoRenderer;
            if (secInfo?.owner?.videoOwnerRenderer?.subscriberCountText?.simpleText) {
                subscribers = secInfo.owner.videoOwnerRenderer.subscriberCountText.simpleText;
            }
            
            const factoids = initialData?.engagementPanels?.find((p: any) => p.engagementPanelSectionListRenderer?.targetId === 'engagement-panel-structured-description')
                ?.engagementPanelSectionListRenderer?.content?.structuredDescriptionContentRenderer?.items?.find((i: any) => i.videoDescriptionHeaderRenderer)?.videoDescriptionHeaderRenderer?.factoid || [];
            const likesFactoid = factoids.find((f: any) => f.factoidRenderer?.accessibilityText?.toLowerCase().includes('like'));
            if (likesFactoid) likes = likesFactoid.factoidRenderer.accessibilityText;
            
            const commentsPanel = initialData?.engagementPanels?.find((p: any) => p.engagementPanelSectionListRenderer?.panelIdentifier === 'engagement-panel-comments-section');
            if (commentsPanel) {
                comments = commentsPanel.engagementPanelSectionListRenderer.header.engagementPanelTitleHeaderRenderer.contextualInfo?.runs?.[0]?.text || '';
            }
        } catch (e) {}

        const video: YouTubeFormats[] = [];
        const videoOnly: YouTubeFormats[] = [];
        const audio: YouTubeFormats[] = [];

        const rawFormats = [
            ...(streamingData?.formats || []),
            ...(streamingData?.adaptiveFormats || []),
            ...(htmlStreamingData?.formats || []),
            ...(htmlStreamingData?.adaptiveFormats || [])
        ];
        
        const formatMap = new Map<number, any>();
        for (const format of rawFormats) {
            if (format.url && format.itag && !formatMap.has(format.itag)) {
                formatMap.set(format.itag, format);
            }
        }
        
        for (const format of formatMap.values()) {
                const mimeType = format.mimeType || '';
                const formatObj = {
                    url: format.url,
                    mimeType: mimeType,
                    width: format.width,
                    height: format.height,
                    quality: format.qualityLabel || format.quality,
                    bitrate: format.bitrate,
                    hasAudio: mimeType.includes('audio/') || !!format.audioChannels || !!format.audioSampleRate,
                    hasVideo: mimeType.includes('video/') || !!format.width
                };

                if (formatObj.hasVideo && formatObj.hasAudio) video.push(formatObj);
                else if (formatObj.hasVideo) videoOnly.push(formatObj);
                else if (formatObj.hasAudio) audio.push(formatObj);
        }

        return {
            title: details.title || '',
            author: details.author || '',
            subscribers: subscribers,
            description: details.shortDescription || '',
            views: details.viewCount || '0',
            likes: likes,
            comments: comments,
            durationSeconds: details.lengthSeconds || '0',
            thumbnail: details.thumbnail?.thumbnails?.[details.thumbnail.thumbnails.length - 1]?.url || '',
            formats: {
                video,
                videoOnly,
                audio
            }
        };
    }
}
