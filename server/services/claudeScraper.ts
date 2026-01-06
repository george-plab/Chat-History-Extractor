import puppeteer from 'puppeteer';
import type { Conversation, Message, Platform } from '../types';

/**
 * Claude URL Scraper using Puppeteer
 * Extracts conversation data from public Claude share URLs
 */

/**
 * Fetch and parse a public Claude conversation URL using headless browser
 */
export async function scrapeClaudeUrl(url: string): Promise<Conversation[]> {
    let browser = null;

    try {
        // Validate URL format
        if (!isValidClaudeUrl(url)) {
            throw new Error('Invalid Claude URL. Expected format: https://claude.ai/share/...');
        }

        console.log(`[Claude Scraper] Launching browser for URL: ${url}`);

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

        console.log(`[Claude Scraper] Navigating to URL...`);

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000,
        });

        console.log(`[Claude Scraper] Waiting for content to load...`);

        // Wait for content
        const possibleSelectors = [
            '[data-role]',
            '.prose',
            '[class*="human"]',
            '[class*="assistant"]',
            '[class*="message"]',
        ];

        for (const selector of possibleSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                console.log(`[Claude Scraper] Found content with selector: ${selector}`);
                break;
            } catch {
                // Try next
            }
        }

        // Additional wait for dynamic content
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract conversation data
        console.log(`[Claude Scraper] Extracting conversation data...`);

        const data = await page.evaluate(() => {
            const messages: { role: 'user' | 'assistant'; content: string }[] = [];
            let title = document.title?.replace(' - Claude', '').replace('Claude - ', '').trim() || 'Claude Conversation';

            // Method 1: Look for data-role attributes
            const roleElements = document.querySelectorAll('[data-role]');
            if (roleElements.length > 0) {
                roleElements.forEach((el) => {
                    const role = el.getAttribute('data-role');
                    if (role === 'human' || role === 'user' || role === 'assistant') {
                        const content = el.textContent?.trim() || '';
                        if (content) {
                            messages.push({
                                role: role === 'human' || role === 'user' ? 'user' : 'assistant',
                                content,
                            });
                        }
                    }
                });
            }

            // Method 2: Look for class-based indicators
            if (messages.length === 0) {
                const humanElements = document.querySelectorAll('[class*="human"], [class*="user"]');
                const assistantElements = document.querySelectorAll('[class*="assistant"], [class*="claude"]');

                // Collect all messages with their positions
                const allMessages: { el: Element; role: 'user' | 'assistant'; top: number }[] = [];

                humanElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const content = el.textContent?.trim() || '';
                    if (content.length > 0) {
                        allMessages.push({ el, role: 'user', top: rect.top });
                    }
                });

                assistantElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const content = el.textContent?.trim() || '';
                    if (content.length > 0) {
                        allMessages.push({ el, role: 'assistant', top: rect.top });
                    }
                });

                // Sort by position and extract
                allMessages.sort((a, b) => a.top - b.top);
                allMessages.forEach(({ el, role }) => {
                    const content = el.textContent?.trim() || '';
                    if (content) {
                        messages.push({ role, content });
                    }
                });
            }

            // Method 3: Look for prose containers
            if (messages.length === 0) {
                const proseElements = document.querySelectorAll('.prose, [class*="content"]');
                proseElements.forEach((el, idx) => {
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

        console.log(`[Claude Scraper] Extracted ${data.messages.length} messages`);

        return [{
            id: extractShareId(url),
            title: data.title,
            messages: data.messages,
            timestamp: new Date().toISOString(),
            platform: 'claude' as Platform,
        }];

    } catch (error) {
        if (browser) {
            await browser.close();
        }

        if (error instanceof Error) {
            if (error.message.includes('net::ERR_')) {
                throw new Error('Failed to connect to Claude. Please check your internet connection.');
            }
            if (error.message.includes('timeout')) {
                throw new Error('Page load timeout. The page may be slow or inaccessible.');
            }
            throw error;
        }
        throw new Error('Unknown error occurred while scraping Claude');
    }
}

/**
 * Validate Claude share URL format
 */
function isValidClaudeUrl(url: string): boolean {
    return /^https:\/\/claude\.ai\/share\/[a-zA-Z0-9-]+/.test(url);
}

/**
 * Extract share ID from URL
 */
function extractShareId(url: string): string {
    const match = url.match(/\/share\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : `claude-${Date.now()}`;
}

/**
 * Check if URL is a Claude URL
 */
export function isClaudeUrl(url: string): boolean {
    return url.includes('claude.ai');
}
