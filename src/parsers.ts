import type {
    Conversation,
    Message,
    OllamaConversation,
    LMStudioConversation,
    ChatGPTConversation,
    GeminiConversation,
    ClaudeConversation,
    Platform,
} from './types';

/**
 * Parse Ollama chat history
 */
export function parseOllama(data: any): Conversation[] {
    try {
        // Handle both single conversation and array of conversations
        const conversations = Array.isArray(data) ? data : [data];

        return conversations.map((conv: OllamaConversation, index: number) => {
            const messages: Message[] = (conv.messages || []).map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.content,
                timestamp: msg.created_at,
            }));

            return {
                id: conv.id || `ollama-${index}`,
                title: conv.name || `Ollama Conversation ${index + 1}`,
                messages,
                timestamp: conv.created_at,
                platform: 'ollama' as Platform,
            };
        });
    } catch (error) {
        console.error('Error parsing Ollama data:', error);
        throw new Error('Invalid Ollama JSON format');
    }
}

/**
 * Parse LM Studio chat history
 * LM Studio uses a complex nested structure with versions and steps
 */
export function parseLMStudio(data: any): Conversation[] {
    try {
        // LM Studio exports a single conversation object
        const conv = Array.isArray(data) ? data[0] : data;

        if (!conv || !conv.messages) {
            throw new Error('Invalid LM Studio format: missing messages array');
        }

        const messages: Message[] = [];

        // Process each message in the conversation
        conv.messages.forEach((msg: any) => {
            // Get the currently selected version
            const versionIndex = msg.currentlySelected || 0;
            const version = msg.versions?.[versionIndex];

            if (!version) return;

            // Handle different version types
            if (version.type === 'singleStep') {
                // User message - simple structure
                const content = version.content?.[0]?.text || '';
                if (content && version.role) {
                    messages.push({
                        role: version.role === 'user' ? 'user' : 'assistant',
                        content: content,
                        timestamp: undefined,
                    });
                }
            } else if (version.type === 'multiStep') {
                // Assistant message - complex structure with steps
                let fullContent = '';

                version.steps?.forEach((step: any) => {
                    if (step.type === 'contentBlock') {
                        // Extract text from content array
                        step.content?.forEach((contentItem: any) => {
                            if (contentItem.type === 'text' && contentItem.text) {
                                fullContent += contentItem.text;
                            }
                        });
                    }
                });

                if (fullContent && version.role) {
                    messages.push({
                        role: version.role === 'assistant' ? 'assistant' : 'user',
                        content: fullContent,
                        timestamp: undefined,
                    });
                }
            }
        });

        return [{
            id: conv.name || 'lmstudio-conversation',
            title: conv.name || 'LM Studio Conversation',
            messages,
            timestamp: conv.createdAt ? new Date(conv.createdAt).toISOString() : undefined,
            platform: 'lmstudio' as Platform,
        }];
    } catch (error) {
        console.error('Error parsing LM Studio data:', error);
        throw new Error(`Invalid LM Studio JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Parse ChatGPT chat history
 */
export function parseChatGPT(data: any): Conversation[] {
    try {
        // ChatGPT exports can be a single conversation or array
        const conversations = Array.isArray(data) ? data : [data];

        return conversations.map((conv: ChatGPTConversation, index: number) => {
            const messages: Message[] = [];

            // ChatGPT uses a mapping structure
            if (conv.mapping) {
                Object.values(conv.mapping).forEach(node => {
                    if (node.message && node.message.content) {
                        const content = node.message.content.parts
                            ? node.message.content.parts.join('\n')
                            : node.message.content.text || '';

                        if (content && node.message.role !== 'system') {
                            messages.push({
                                role: node.message.role === 'user' ? 'user' : 'assistant',
                                content,
                                timestamp: node.message.create_time
                                    ? new Date(node.message.create_time * 1000).toISOString()
                                    : undefined,
                            });
                        }
                    }
                });
            }

            return {
                id: conv.id || `chatgpt-${index}`,
                title: conv.title || `ChatGPT Conversation ${index + 1}`,
                messages,
                timestamp: conv.create_time
                    ? new Date(conv.create_time * 1000).toISOString()
                    : undefined,
                platform: 'chatgpt' as Platform,
            };
        });
    } catch (error) {
        console.error('Error parsing ChatGPT data:', error);
        throw new Error('Invalid ChatGPT JSON format');
    }
}

/**
 * Parse Gemini (Google AI Studio) chat history
 */
export function parseGemini(data: any): Conversation[] {
    try {
        const conversations = Array.isArray(data) ? data : [data];

        return conversations.map((conv: GeminiConversation, index: number) => {
            const messageArray = conv.contents || conv.history || [];

            const messages: Message[] = messageArray.map(msg => {
                let content = '';

                if (msg.parts && Array.isArray(msg.parts)) {
                    content = msg.parts.map(part => part.text).join('\n');
                } else if (msg.text) {
                    content = msg.text;
                }

                return {
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content,
                    timestamp: conv.createTime,
                };
            });

            return {
                id: conv.id || `gemini-${index}`,
                title: conv.name || `Gemini Conversation ${index + 1}`,
                messages,
                timestamp: conv.createTime,
                platform: 'gemini' as Platform,
            };
        });
    } catch (error) {
        console.error('Error parsing Gemini data:', error);
        throw new Error('Invalid Gemini JSON format');
    }
}

/**
 * Parse Claude (Anthropic) chat history
 */
export function parseClaude(data: any): Conversation[] {
    try {
        const conversations = Array.isArray(data) ? data : [data];

        return conversations.map((conv: ClaudeConversation, index: number) => {
            const messages: Message[] = (conv.messages || []).map(msg => {
                let content = '';

                if (typeof msg.content === 'string') {
                    content = msg.content;
                } else if (Array.isArray(msg.content)) {
                    content = msg.content
                        .filter(item => item.type === 'text')
                        .map(item => item.text)
                        .join('\n');
                }

                return {
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content,
                    timestamp: msg.timestamp,
                };
            });

            return {
                id: conv.id || `claude-${index}`,
                title: conv.name || `Claude Conversation ${index + 1}`,
                messages,
                timestamp: conv.created_at,
                platform: 'claude' as Platform,
            };
        });
    } catch (error) {
        console.error('Error parsing Claude data:', error);
        throw new Error('Invalid Claude JSON format');
    }
}

/**
 * Main parser function that detects platform and parses accordingly
 */
export function parseConversations(data: any, platform: Platform): Conversation[] {
    switch (platform) {
        case 'ollama':
            return parseOllama(data);
        case 'lmstudio':
            return parseLMStudio(data);
        case 'chatgpt':
            return parseChatGPT(data);
        case 'gemini':
            return parseGemini(data);
        case 'claude':
            return parseClaude(data);
        default:
            throw new Error(`Unsupported platform: ${platform}`);
    }
}
