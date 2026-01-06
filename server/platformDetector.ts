import type { Platform } from './types';

/**
 * Detect the platform from JSON data structure
 */
export function detectPlatform(data: any): Platform | null {
    try {
        // Handle array case
        const firstItem = Array.isArray(data) ? data[0] : data;

        if (!firstItem) return null;

        // LM Studio detection: has messages array with versions/steps structure
        if (firstItem.messages && Array.isArray(firstItem.messages)) {
            const firstMsg = firstItem.messages[0];
            if (firstMsg?.versions || firstMsg?.currentlySelected !== undefined) {
                return 'lmstudio';
            }
        }

        // ChatGPT detection: has mapping with nested message objects
        if (firstItem.mapping && typeof firstItem.mapping === 'object') {
            const mappingValues = Object.values(firstItem.mapping);
            if (mappingValues.length > 0 && (mappingValues[0] as any)?.message) {
                return 'chatgpt';
            }
        }

        // Gemini detection: has contents array with parts
        if (firstItem.contents && Array.isArray(firstItem.contents)) {
            const firstContent = firstItem.contents[0];
            if (firstContent?.parts || firstContent?.role) {
                return 'gemini';
            }
        }

        // Gemini alternative: has history array
        if (firstItem.history && Array.isArray(firstItem.history)) {
            const firstHistory = firstItem.history[0];
            if (firstHistory?.parts) {
                return 'gemini';
            }
        }

        // Claude detection: messages with content arrays containing type/text
        if (firstItem.messages && Array.isArray(firstItem.messages)) {
            const firstMsg = firstItem.messages[0];
            if (firstMsg?.content) {
                if (Array.isArray(firstMsg.content) && firstMsg.content[0]?.type === 'text') {
                    return 'claude';
                }
            }
        }

        // Ollama detection: simple messages array with role/content
        if (firstItem.messages && Array.isArray(firstItem.messages)) {
            const firstMsg = firstItem.messages[0];
            if (firstMsg?.role && firstMsg?.content && typeof firstMsg.content === 'string') {
                // Check it's not LM Studio
                if (!firstMsg.versions && firstMsg.currentlySelected === undefined) {
                    return 'ollama';
                }
            }
        }

        return null;
    } catch (error) {
        console.error('Error detecting platform:', error);
        return null;
    }
}

/**
 * Detect platform from URL
 */
export function detectPlatformFromUrl(url: string): Platform | null {
    const urlLower = url.toLowerCase();

    if (urlLower.includes('chat.openai.com') || urlLower.includes('chatgpt.com')) {
        return 'chatgpt';
    }

    if (urlLower.includes('claude.ai')) {
        return 'claude';
    }

    if (urlLower.includes('gemini.google.com') || urlLower.includes('aistudio.google.com')) {
        return 'gemini';
    }

    return null;
}

/**
 * Get human-readable platform name
 */
export function getPlatformName(platform: Platform): string {
    const names: Record<Platform, string> = {
        ollama: 'Ollama',
        lmstudio: 'LM Studio',
        chatgpt: 'ChatGPT',
        gemini: 'Gemini',
        claude: 'Claude',
    };
    return names[platform] || platform;
}
