import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import type { Conversation, Message, Platform } from '../types';

// Use stealth plugin to avoid bot detection
puppeteer.use(StealthPlugin());

/**
 * ChatGPT URL Scraper using Puppeteer with Stealth
 * Extracts conversation data from public ChatGPT share URLs
 */

/**
 * Fetch and parse a public ChatGPT conversation URL using headless browser
 */
export async function scrapeChatGPTUrl(url: string): Promise<Conversation[]> {
    let browser = null;

    try {
        // Validate URL format
        if (!isValidChatGPTUrl(url)) {
            throw new Error('Invalid ChatGPT URL. Expected format: https://chat.openai.com/share/... or https://chatgpt.com/share/...');
        }

        console.log(`[ChatGPT Scraper] Launching stealth browser for URL: ${url}`);

        // Launch headless browser with stealth mode
        browser = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--lang=en-US,en',
            ],
        });

        const page = await browser.newPage();

        // Set a realistic user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Set extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        });

        console.log(`[ChatGPT Scraper] Navigating to URL...`);

        // Navigate to the page
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000,
        });

        // Wait a bit for any dynamic content
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if we hit a Cloudflare challenge
        const pageContent = await page.content();
        if (pageContent.includes('Verify you are human') || pageContent.includes('cf-challenge')) {
            console.log(`[ChatGPT Scraper] Cloudflare challenge detected, waiting...`);

            // Wait for potential auto-solve
            await new Promise(resolve => setTimeout(resolve, 10000));

            // Check again
            const newContent = await page.content();
            if (newContent.includes('Verify you are human')) {
                throw new Error('Cloudflare protection detected. Unfortunately, automated bypass is not possible for this page. Please try exporting the conversation manually as JSON.');
            }
        }

        console.log(`[ChatGPT Scraper] Page loaded, extracting content...`);

        // Wait for conversation content to appear
        const possibleSelectors = [
            '[data-message-author-role]',
            '.markdown',
            '[class*="agent-turn"]',
            '[class*="message"]',
            'article',
            '.prose',
        ];

        let contentLoaded = false;
        for (const selector of possibleSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 5000 });
                contentLoaded = true;
                console.log(`[ChatGPT Scraper] Found content with selector: ${selector}`);
                break;
            } catch {
                // Try next selector
            }
        }

        if (!contentLoaded) {
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Extract conversation data
        console.log(`[ChatGPT Scraper] Extracting conversation data...`);

        const data = await page.evaluate(() => {
            const messages: { role: 'user' | 'assistant'; content: string }[] = [];
            let title = document.title?.replace(' | ChatGPT', '').replace('ChatGPT - ', '').trim() || 'ChatGPT Conversation';

            // Method 1: Look for data-message-author-role attributes
            const messageElements = document.querySelectorAll('[data-message-author-role]');
            if (messageElements.length > 0) {
                messageElements.forEach((el) => {
                    const role = el.getAttribute('data-message-author-role');
                    if (role === 'user' || role === 'assistant') {
                        const contentEl = el.querySelector('.markdown, .prose, [class*="markdown"]') || el;
                        const content = contentEl.textContent?.trim() || '';
                        if (content) {
                            messages.push({
                                role: role as 'user' | 'assistant',
                                content,
                            });
                        }
                    }
                });
            }

            // Method 2: Look for turns
            if (messages.length === 0) {
                const turnElements = document.querySelectorAll('[class*="agent-turn"], [class*="user-turn"], article');
                turnElements.forEach((el) => {
                    const className = el.className || '';
                    const text = el.textContent?.trim() || '';

                    if (text.length > 0) {
                        let role: 'user' | 'assistant' = 'assistant';
                        if (className.includes('user') || className.includes('human')) {
                            role = 'user';
                        }
                        messages.push({ role, content: text });
                    }
                });
            }

            // Method 3: Look at the page structure for any conversation
            if (messages.length === 0) {
                // Find all text blocks that might be messages
                const allDivs = document.querySelectorAll('div');
                const potentialMessages: { text: string; rect: DOMRect }[] = [];

                allDivs.forEach(div => {
                    const text = div.textContent?.trim() || '';
                    // Look for substantial text blocks
                    if (text.length > 50 && text.length < 20000) {
                        const rect = div.getBoundingClientRect();
                        if (rect.width > 400 && rect.height > 50) {
                            potentialMessages.push({ text, rect });
                        }
                    }
                });

                // Sort by position and dedupe
                potentialMessages.sort((a, b) => a.rect.top - b.rect.top);

                const seen = new Set<string>();
                potentialMessages.forEach((msg, idx) => {
                    if (!seen.has(msg.text.substring(0, 100))) {
                        seen.add(msg.text.substring(0, 100));
                        messages.push({
                            role: idx % 2 === 0 ? 'user' : 'assistant',
                            content: msg.text,
                        });
                    }
                });
            }

            return { title, messages };
        });

        await browser.close();
        browser = null;

        if (!data || data.messages.length === 0) {
            throw new Error('Could not extract conversation data. The page may have Cloudflare protection or the structure has changed. Try exporting as JSON manually instead.');
        }

        console.log(`[ChatGPT Scraper] Successfully extracted ${data.messages.length} messages`);

        return [{
            id: extractShareId(url),
            title: data.title,
            messages: data.messages,
            timestamp: new Date().toISOString(),
            platform: 'chatgpt' as Platform,
        }];

    } catch (error) {
        if (browser) {
            await browser.close();
        }

        if (error instanceof Error) {
            if (error.message.includes('net::ERR_')) {
                throw new Error('Failed to connect to ChatGPT. Please check your internet connection.');
            }
            if (error.message.includes('timeout')) {
                throw new Error('Page load timeout. The page may be slow or protected.');
            }
            throw error;
        }
        throw new Error('Unknown error occurred while scraping ChatGPT');
    }
}

/**
 * Validate ChatGPT share URL format
 */
function isValidChatGPTUrl(url: string): boolean {
    const patterns = [
        /^https:\/\/chat\.openai\.com\/share\/[a-zA-Z0-9-]+/,
        /^https:\/\/chatgpt\.com\/share\/[a-zA-Z0-9-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
}

/**
 * Extract share ID from URL
 */
function extractShareId(url: string): string {
    const match = url.match(/\/share\/([a-zA-Z0-9-]+)/);
    return match ? match[1] : `chatgpt-${Date.now()}`;
}

/**
 * Check if URL is a ChatGPT URL
 */
export function isChatGPTUrl(url: string): boolean {
    return url.includes('chat.openai.com') || url.includes('chatgpt.com');
}
