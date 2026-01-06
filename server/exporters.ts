import type { Conversation } from './types';

/**
 * Convert conversations to Markdown format
 */
export function exportToMarkdown(conversations: Conversation[], showHeaders: boolean = true): string {
    let markdown = '# Chat History Export\n\n';
    markdown += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
    markdown += `**Total Conversations:** ${conversations.length}\n\n`;
    markdown += '---\n\n';

    conversations.forEach((conv, convIndex) => {
        markdown += `## Conversation ${convIndex + 1}: ${conv.title}\n\n`;
        markdown += `**Platform:** ${conv.platform.toUpperCase()}\n`;
        markdown += `**ID:** ${conv.id}\n`;
        if (conv.timestamp) {
            markdown += `**Date:** ${new Date(conv.timestamp).toLocaleString()}\n`;
        }
        markdown += '\n';

        conv.messages.forEach((msg, msgIndex) => {
            if (showHeaders) {
                const role = msg.role === 'user' ? 'Usuario' : 'Asistente';
                markdown += `### Mensaje ${msgIndex + 1} - ${role}\n\n`;

                if (msg.timestamp) {
                    markdown += `*${new Date(msg.timestamp).toLocaleString()}*\n\n`;
                }
            }

            markdown += `${msg.content}\n\n`;
            markdown += '---\n\n';
        });

        markdown += '\n\n';
    });

    return markdown;
}

/**
 * Generate filename for export
 */
export function generateFilename(platform: string, format: 'md' | 'pdf'): string {
    const timestamp = Date.now();
    return `${platform}-chat-history-${timestamp}.${format}`;
}
