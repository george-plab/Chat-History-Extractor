import puppeteer from 'puppeteer';
import type { Conversation, Message, Platform } from '../types';

/**
 * Gemini URL Scraper using Puppeteer
 * Extracts conversation data from public Gemini share URLs
 */

/**
 * Fetch and parse a public Gemini conversation URL using headless browser
 */
export async function scrapeGeminiUrl(url: string): Promise<Conversation[]> {
    let browser = null;

    try {
        // Validate URL format
        if (!isValidGeminiUrl(url)) {
            throw new Error('Invalid Gemini URL. Expected format: https://gemini.google.com/share/... or https://g.co/gemini/share/...');
        }

        console.log(`[Gemini Scraper] Launching browser for URL: ${url}`);

        // Launch headless browser
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
            ],
        });

        const page = await browser.newPage();

        // Set user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        await page.setViewport({ width: 1920, height: 1080 });

        console.log(`[Gemini Scraper] Navigating to URL...`);

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        console.log(`[Gemini Scraper] Waiting for content to load...`);

        // Wait for content
        const possibleSelectors = [
            '[data-message-role]',
            '[class*="prompt"]',
            '[class*="response"]',
            '[class*="message"]',
            '[class*="turn"]',
        ];

        for (const selector of possibleSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                console.log(`[Gemini Scraper] Found content with selector: ${selector}`);
                break;
            } catch {
                // Try next
            }
        }

        // Additional wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract conversation data
        console.log(`[Gemini Scraper] Extracting conversation data...`);

        const data = await page.evaluate(() => {
            const messages: { role: 'user' | 'assistant'; content: string }[] = [];
            let title = document.title?.trim() || 'Gemini Conversation';
            if (title.includes('Gemini')) {
                title = title.replace('Gemini - ', '').replace(' - Gemini', '').trim() || 'Gemini Conversation';
            }

            // Method 1: Look for data-message-role attributes
            const roleElements = document.querySelectorAll('[data-message-role]');
            if (roleElements.length > 0) {
                roleElements.forEach((el) => {
                    const role = el.getAttribute('data-message-role');
                    if (role === 'user' || role === 'model' || role === 'assistant') {
                        const content = el.textContent?.trim() || '';
                        if (content) {
                            messages.push({
                                role: role === 'user' ? 'user' : 'assistant',
                                content,
                            });
                        }
                    }
                });
            }

            // Method 2: Look for prompt/response class patterns
            if (messages.length === 0) {
                const promptElements = document.querySelectorAll('[class*="prompt"], [class*="user"], [class*="human"]');
                const responseElements = document.querySelectorAll('[class*="response"], [class*="model"], [class*="assistant"]');

                const allMessages: { el: Element; role: 'user' | 'assistant'; top: number }[] = [];

                promptElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const content = el.textContent?.trim() || '';
                    if (content.length > 0) {
                        allMessages.push({ el, role: 'user', top: rect.top });
                    }
                });

                responseElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const content = el.textContent?.trim() || '';
                    if (content.length > 0) {
                        allMessages.push({ el, role: 'assistant', top: rect.top });
                    }
                });

                // Sort by position
                allMessages.sort((a, b) => a.top - b.top);
                allMessages.forEach(({ el, role }) => {
                    const content = el.textContent?.trim() || '';
                    if (content) {
                        messages.push({ role, content });
                    }
                });
            }

            // Method 3: Look for turn-based containers
            if (messages.length === 0) {
                const turnElements = document.querySelectorAll('[class*="turn"], [class*="message"]');
                turnElements.forEach((el, idx) => {
                    const content = el.textContent?.trim() || '';
                    if (content.length > 10) {
                        messages.push({
                            role: idx % 2 === 0 ? 'user' : 'assistant',
                            content,
                        });
                    }
                });
            }

            return { title, messages };
        });

        await browser.close();
        browser = null;

        if (!data || data.messages.length === 0) {
            throw new Error('Could not extract conversation data from the page. The page structure may have changed or the conversation is not accessible.');
        }

        console.log(`[Gemini Scraper] Extracted ${data.messages.length} messages`);

        return [{
            id: extractShareId(url),
            title: data.title,
            messages: data.messages,
            timestamp: new Date().toISOString(),
            platform: 'gemini' as Platform,
        }];

    } catch (error) {
        if (browser) {
            await browser.close();
        }

        if (error instanceof Error) {
            if (error.message.includes('net::ERR_')) {
                throw new Error('Failed to connect to Gemini. Please check your internet connection.');
            }
            if (error.message.includes('timeout')) {
                throw new Error('Page load timeout. The page may be slow or inaccessible.');
            }
            throw error;
        }
        throw new Error('Unknown error occurred while scraping Gemini');
    }
}

/**
 * Validate Gemini share URL format
 */
function isValidGeminiUrl(url: string): boolean {
    const patterns = [
        /^https:\/\/gemini\.google\.com\/share\//,
        /^https:\/\/g\.co\/gemini\/share\//,
        /^https:\/\/aistudio\.google\.com\//,
    ];
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Extract share ID from URL
 */
function extractShareId(url: string): string {
    const match = url.match(/\/share\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : `gemini-${Date.now()}`;
}

/**
 * Check if URL is a Gemini URL
 */
export function isGeminiUrl(url: string): boolean {
    return url.includes('gemini.google.com') ||
        url.includes('g.co/gemini') ||
        url.includes('aistudio.google.com');
}
