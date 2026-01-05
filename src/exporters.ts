import jsPDF from 'jspdf';
import type { Conversation, ExportResult } from './types';

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
 * Download markdown file
 */
export function downloadMarkdown(conversations: Conversation[], showHeaders: boolean = true, filename?: string): void {
    const markdown = exportToMarkdown(conversations, showHeaders);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `chat-history-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Convert conversations to PDF format
 */
export function exportToPDF(conversations: Conversation[], showHeaders: boolean = true, filename?: string): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add new page if needed
    const checkPageBreak = (requiredSpace: number = 10) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
            return true;
        }
        return false;
    };



    // Title
    doc.setFillColor(102, 126, 234);
    doc.rect(0, 0, pageWidth, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Chat History Export', pageWidth / 2, 20, { align: 'center' });

    yPosition = 45;
    doc.setTextColor(0, 0, 0);

    // Metadata
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Export Date: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 7;
    doc.text(`Total Conversations: ${conversations.length}`, margin, yPosition);
    yPosition += 15;

    // Conversations
    conversations.forEach((conv, convIndex) => {
        checkPageBreak(30);

        // Conversation header
        doc.setFillColor(240, 240, 245);
        doc.rect(margin - 5, yPosition - 5, maxWidth + 10, 25, 'F');

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(102, 126, 234);
        doc.text(`Conversation ${convIndex + 1}: ${conv.title}`, margin, yPosition + 5);
        yPosition += 12;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(`Platform: ${conv.platform.toUpperCase()} | ID: ${conv.id}`, margin, yPosition + 5);
        yPosition += 20;

        doc.setTextColor(0, 0, 0);

        // Messages
        conv.messages.forEach((msg, msgIndex) => {
            checkPageBreak(20);

            if (showHeaders) {
                // Message header
                const isUser = msg.role === 'user';
                doc.setFillColor(isUser ? 230 : 240, isUser ? 240 : 255, isUser ? 255 : 240);
                doc.rect(margin - 3, yPosition - 3, maxWidth + 6, 10, 'F');

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(isUser ? 67 : 76, isUser ? 97 : 175, isUser ? 238 : 80);
                const roleText = isUser ? 'Usuario' : 'Asistente';
                doc.text(`${roleText} - Mensaje ${msgIndex + 1}`, margin, yPosition + 4);
                yPosition += 12;

                // Timestamp
                if (msg.timestamp) {
                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.setFont('helvetica', 'italic');
                    doc.text(new Date(msg.timestamp).toLocaleString(), margin, yPosition);
                    yPosition += 8;
                }
            }

            // Message content
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            const contentLines = doc.splitTextToSize(msg.content, maxWidth - 10);
            contentLines.forEach((line: string) => {
                checkPageBreak(6);
                doc.text(line, margin + 5, yPosition);
                yPosition += 6;
            });

            yPosition += 8;

            // Separator
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 10;
        });

        yPosition += 10;
    });

    // Footer on last page
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // Save PDF
    doc.save(filename || `chat-history-${Date.now()}.pdf`);
}

/**
 * Create export result object
 */
export function createExportResult(conversations: Conversation[]): ExportResult {
    return {
        conversations,
        platform: conversations[0]?.platform || 'ollama',
        exportDate: new Date().toISOString(),
    };
}
