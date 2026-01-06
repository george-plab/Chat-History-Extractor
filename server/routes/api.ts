import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ProcessFileRequest, ProcessUrlRequest, ProcessResponse, ExportRequest, ExportResponse, Platform } from '../types';
import { parseConversations } from '../parsers';
import { detectPlatform, detectPlatformFromUrl, getPlatformName } from '../platformDetector';
import { exportToMarkdown, generateFilename } from '../exporters';
import { scrapeChatGPTUrl, isChatGPTUrl } from '../services/chatgptScraper';
import { scrapeClaudeUrl, isClaudeUrl } from '../services/claudeScraper';
import { scrapeGeminiUrl, isGeminiUrl } from '../services/geminiScraper';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

/**
 * Process a JSON file content
 * POST /api/process-file
 */
router.post('/process-file', async (req: Request<{}, {}, ProcessFileRequest>, res: Response<ProcessResponse>) => {
    try {
        const { content, platform } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                error: 'No content provided. Please send JSON content in the request body.',
            });
        }

        // Parse the JSON content
        let data: any;
        try {
            data = JSON.parse(content);
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid JSON format. Please check your file content.',
            });
        }

        // Detect platform if not specified
        const detectedPlatform = detectPlatform(data);
        const usePlatform = platform || detectedPlatform;

        if (!usePlatform) {
            return res.status(400).json({
                success: false,
                error: 'Could not detect platform. Please specify the platform manually.',
            });
        }

        // Check for platform mismatch
        let warning: string | undefined;
        if (platform && detectedPlatform && platform !== detectedPlatform) {
            warning = `El JSON parece ser de ${getPlatformName(detectedPlatform)}, pero se especificó ${getPlatformName(platform)}. Usando ${getPlatformName(platform)}.`;
        }

        // Parse conversations
        const conversations = parseConversations(data, usePlatform);

        console.log(`[API] Processed ${conversations.length} conversations from ${usePlatform}`);

        return res.json({
            success: true,
            conversations,
            detectedPlatform: detectedPlatform || undefined,
            warning,
        });

    } catch (error) {
        console.error('[API] Error processing file:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error processing file',
        });
    }
});

/**
 * Process a public URL
 * POST /api/process-url
 */
router.post('/process-url', async (req: Request<{}, {}, ProcessUrlRequest>, res: Response<ProcessResponse>) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                success: false,
                error: 'No URL provided. Please send a URL in the request body.',
            });
        }

        // Validate URL format
        try {
            new URL(url);
        } catch {
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format.',
            });
        }

        // Detect platform from URL
        const detectedPlatform = detectPlatformFromUrl(url);

        if (!detectedPlatform) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported URL. Only ChatGPT, Claude, and Gemini public share URLs are supported.',
            });
        }

        console.log(`[API] Processing ${detectedPlatform} URL: ${url}`);

        // Scrape based on platform
        let conversations;

        if (isChatGPTUrl(url)) {
            conversations = await scrapeChatGPTUrl(url);
        } else if (isClaudeUrl(url)) {
            conversations = await scrapeClaudeUrl(url);
        } else if (isGeminiUrl(url)) {
            conversations = await scrapeGeminiUrl(url);
        } else {
            return res.status(400).json({
                success: false,
                error: 'Unsupported platform URL.',
            });
        }

        console.log(`[API] Scraped ${conversations.length} conversations with ${conversations.reduce((t, c) => t + c.messages.length, 0)} total messages`);

        return res.json({
            success: true,
            conversations,
            detectedPlatform,
        });

    } catch (error) {
        console.error('[API] Error processing URL:', error);
        return res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error processing URL',
        });
    }
});

/**
 * Export conversations to Markdown
 * POST /api/export
 */
router.post('/export', (req: Request<{}, {}, ExportRequest>, res: Response<ExportResponse>) => {
    try {
        const { conversations, format, showHeaders, filename } = req.body;

        if (!conversations || !Array.isArray(conversations) || conversations.length === 0) {
            return res.status(400).json({
                success: false,
                filename: '',
                mimeType: '',
                error: 'No conversations provided.',
            });
        }

        const platform = conversations[0]?.platform || 'chat';

        if (format === 'markdown') {
            const markdown = exportToMarkdown(conversations, showHeaders);
            const outputFilename = filename || generateFilename(platform, 'md');

            return res.json({
                success: true,
                content: markdown,
                filename: outputFilename,
                mimeType: 'text/markdown',
            });
        }

        // PDF export would require jsPDF on server - return error for now
        if (format === 'pdf') {
            return res.status(400).json({
                success: false,
                filename: '',
                mimeType: '',
                error: 'PDF export is handled client-side. Use the markdown export on the server.',
            });
        }

        return res.status(400).json({
            success: false,
            filename: '',
            mimeType: '',
            error: 'Invalid export format. Supported formats: markdown',
        });

    } catch (error) {
        console.error('[API] Error exporting:', error);
        return res.status(500).json({
            success: false,
            filename: '',
            mimeType: '',
            error: error instanceof Error ? error.message : 'Unknown error during export',
        });
    }
});

/**
 * Get supported platforms
 * GET /api/platforms
 */
router.get('/platforms', (_req: Request, res: Response) => {
    const platforms: { id: Platform; name: string; supportsUrl: boolean; supportsFile: boolean }[] = [
        { id: 'chatgpt', name: 'ChatGPT', supportsUrl: true, supportsFile: true },
        { id: 'claude', name: 'Claude', supportsUrl: true, supportsFile: true },
        { id: 'gemini', name: 'Gemini', supportsUrl: true, supportsFile: true },
        { id: 'ollama', name: 'Ollama', supportsUrl: false, supportsFile: true },
        { id: 'lmstudio', name: 'LM Studio', supportsUrl: false, supportsFile: true },
    ];

    res.json({ platforms });
});

export default router;
