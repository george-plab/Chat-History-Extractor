import type { Platform } from './types';

/**
 * Detect the platform based on JSON structure
 */
export function detectPlatform(data: any): Platform | null {
    try {
        // Check for array vs single object
        const sample = Array.isArray(data) ? data[0] : data;

        if (!sample) return null;

        // ChatGPT detection - has 'mapping' field
        if (sample.mapping && typeof sample.mapping === 'object') {
            return 'chatgpt';
        }

        // Gemini detection - has 'contents' or 'history' field
        if (sample.contents || sample.history) {
            return 'gemini';
        }

        // LM Studio detection - has 'messages' with 'versions' structure
        if (sample.messages && Array.isArray(sample.messages)) {
            const firstMessage = sample.messages[0];
            if (firstMessage?.versions && Array.isArray(firstMessage.versions)) {
                return 'lmstudio';
            }
        }

        // Ollama detection - has 'messages' with simple structure and 'created_at'
        if (sample.messages && Array.isArray(sample.messages)) {
            const firstMessage = sample.messages[0];
            if (firstMessage?.role && firstMessage?.content && firstMessage?.created_at) {
                return 'ollama';
            }
        }

        // Claude detection - has 'messages' with content that can be string or array
        if (sample.messages && Array.isArray(sample.messages)) {
            const firstMessage = sample.messages[0];
            if (firstMessage?.role && (
                typeof firstMessage.content === 'string' ||
                (Array.isArray(firstMessage.content) && firstMessage.content[0]?.type === 'text')
            )) {
                return 'claude';
            }
        }

        return null;
    } catch (error) {
        console.error('Error detecting platform:', error);
        return null;
    }
}

/**
 * Get platform name in Spanish
 */
export function getPlatformName(platform: Platform): string {
    const names: Record<Platform, string> = {
        ollama: 'Ollama',
        lmstudio: 'LM Studio',
        chatgpt: 'ChatGPT',
        gemini: 'Gemini',
        claude: 'Claude',
    };
    return names[platform];
}
