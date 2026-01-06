import type { Conversation, Platform, ProcessResponse, ExportResponse } from '../server/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Process a JSON file via the backend API
 */
export async function processFile(content: string, platform?: Platform): Promise<ProcessResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/process-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, platform }),
        });

        const data: ProcessResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API Error (process-file):', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to server',
        };
    }
}

/**
 * Process a public URL via the backend API
 */
export async function processUrl(url: string, platform?: Platform): Promise<ProcessResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/process-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, platform }),
        });

        const data: ProcessResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API Error (process-url):', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to server',
        };
    }
}

/**
 * Export conversations to markdown via the backend API
 */
export async function exportMarkdown(
    conversations: Conversation[],
    showHeaders: boolean,
    filename?: string
): Promise<ExportResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                conversations,
                format: 'markdown',
                showHeaders,
                filename,
            }),
        });

        const data: ExportResponse = await response.json();
        return data;
    } catch (error) {
        console.error('API Error (export):', error);
        return {
            success: false,
            filename: '',
            mimeType: '',
            error: error instanceof Error ? error.message : 'Failed to connect to server',
        };
    }
}

/**
 * Get list of supported platforms
 */
export async function getPlatforms(): Promise<{ id: Platform; name: string; supportsUrl: boolean; supportsFile: boolean }[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/platforms`);
        const data = await response.json();
        return data.platforms || [];
    } catch (error) {
        console.error('API Error (platforms):', error);
        return [];
    }
}

/**
 * Check if the backend server is available
 */
export async function checkServerHealth(): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Download a file with content
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
