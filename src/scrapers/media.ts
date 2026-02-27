import * as cheerio from 'cheerio';
import { StrawClient, StrawClientOptions } from '../core/client';

export interface MediaScrapeResult {
    pageTitle: string;
    mediaLinks: string[];
}

export class MediaScraper {
    private client: StrawClient;

    constructor(options?: StrawClientOptions) {
        this.client = new StrawClient(options);
    }

    /**
     * Attempts to find direct media files (Images/Audio/Video/Documents) referenced in any generic webpage HTML.
     */
    public async extractMedia(url: string): Promise<MediaScrapeResult> {
        const html = await this.client.getText(url);
        const $ = cheerio.load(html);

        const pageTitle = $('title').text().trim();
        const mediaLinks = new Set<string>();

        // 1. Check <video>, <audio>, <img>, and <source> tags
        $('video, audio, img, source').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('srcset');
            if (src) {
                // handle srcset parsing simply by grabbing the first URL if needed, or just finding http links
                const urls = src.match(/https?:\/\/[^\s"',]+/g);
                if (urls) urls.forEach(u => mediaLinks.add(u));
                else if (src.startsWith('http')) mediaLinks.add(src);
            }
        });

        // 2. Check <a> tags for document/media links
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('http') && href.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|mp4|mp3|webm|wav|ogg|m4a|avi|mkv|mov|flv|png|jpg|jpeg|gif|svg|webp|avif|ico|bmp)(\?.*)?$/i)) {
                mediaLinks.add(href);
            }
        });

        // 3. Fallback: Check regex for embedded JSON or JS containing media/document links
        const rawLinksMatch = html.match(/https?:\/\/[^\s"',]+\.(png|jpg|jpeg|gif|svg|webp|avif|ico|bmp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|rtf|mp4|mp3|webm|wav|ogg|m4a|avi|mkv|mov|flv)/gi);
        if (rawLinksMatch) {
            for (const link of rawLinksMatch) {
                mediaLinks.add(link);
            }
        }

        return {
            pageTitle,
            mediaLinks: Array.from(mediaLinks)
        };
    }
}
