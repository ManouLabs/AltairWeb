// src/utilities/media.ts

interface MediaObject {
    original_name?: string;
    name?: string;
    file_name?: string;
    url?: string;
    path?: string;
    src?: string;
    mime_type?: string;
    type?: string;
}

type Media = MediaObject | string | null | undefined;

/**
 * Get the display name of a media file
 */
export function getMediaName(media: Media): string {
    if (!media) return '';

    // If it's a string (URL), extract the filename
    if (typeof media === 'string') {
        const parts = media.split('/');
        const filename = parts[parts.length - 1];
        return decodeURIComponent(filename.split('?')[0]);
    }

    // If it's an object with original_name, name, or file_name property
    return media.original_name || media.name || media.file_name || '';
}

/**
 * Get the URL of a media file
 */
export function getMediaUrl(media: Media): string {
    if (!media) return '';

    // If it's already a string (URL), return it
    if (typeof media === 'string') {
        return media;
    }

    // If it's an object, check for url, path, or src property
    return media.url || media.path || media.src || '';
}

/**
 * Get a human-readable name for a MIME type
 */
export function getMimeTypeName(mimeType: string | null | undefined): string {
    if (!mimeType) return '';

    const mimeTypeMap: Record<string, string> = {
        // Images
        'image/jpeg': 'JPEG',
        'image/jpg': 'JPG',
        'image/png': 'PNG',
        'image/gif': 'GIF',
        'image/webp': 'WebP',
        'image/svg+xml': 'SVG',
        'image/bmp': 'BMP',
        'image/tiff': 'TIFF',
        'image/x-icon': 'ICO',

        // Videos
        'video/mp4': 'MP4',
        'video/mpeg': 'MPEG',
        'video/quicktime': 'MOV',
        'video/x-msvideo': 'AVI',
        'video/webm': 'WebM',
        'video/x-flv': 'FLV',
        'video/x-matroska': 'MKV',

        // Audio
        'audio/mpeg': 'MP3',
        'audio/wav': 'WAV',
        'audio/ogg': 'OGG',
        'audio/webm': 'WebM Audio',
        'audio/aac': 'AAC',
        'audio/flac': 'FLAC',

        // Documents
        'application/pdf': 'PDF',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'application/vnd.ms-excel': 'XLS',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
        'application/vnd.ms-powerpoint': 'PPT',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
        'application/zip': 'ZIP',
        'application/x-rar-compressed': 'RAR',
        'application/x-7z-compressed': '7Z',
        'application/json': 'JSON',
        'application/xml': 'XML',

        // Text
        'text/plain': 'TXT',
        'text/html': 'HTML',
        'text/css': 'CSS',
        'text/javascript': 'JS',
        'text/csv': 'CSV'
    };

    // Try exact match
    if (mimeTypeMap[mimeType]) {
        return mimeTypeMap[mimeType];
    }

    // Try to get a general type from the first part
    const mainType = mimeType.split('/')[0];
    const subType = mimeType.split('/')[1];

    if (mainType === 'image') return 'Image';
    if (mainType === 'video') return 'Video';
    if (mainType === 'audio') return 'Audio';
    if (mainType === 'text') return 'Text';
    if (mainType === 'application') {
        return subType ? subType.toUpperCase() : 'File';
    }

    return mimeType;
}

/**
 * Check if media is an image
 */
export function isImageMedia(media: Media): boolean {
    if (!media) return false;

    // Check object properties
    if (typeof media === 'object') {
        // Check mime_type property
        if (media.mime_type) {
            return media.mime_type.startsWith('image/');
        }

        // Check type property
        if (media.type) {
            return media.type.startsWith('image/');
        }

        // Check url or path property
        const url = media.url || media.path || media.src;
        if (url && typeof url === 'string') {
            const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)(\?.*)?$/i;
            return imageExtensions.test(url);
        }

        return false;
    }

    // If it's a string (URL), check file extension
    if (typeof media === 'string') {
        const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|ico)(\?.*)?$/i;
        return imageExtensions.test(media);
    }

    return false;
}

/**
 * Check if media is a video
 */
export function isVideoMedia(media: Media): boolean {
    if (!media) return false;

    // Check object properties
    if (typeof media === 'object') {
        // Check mime_type property
        if (media.mime_type) {
            return media.mime_type.startsWith('video/');
        }

        // Check type property
        if (media.type) {
            return media.type.startsWith('video/');
        }

        // Check url or path property
        const url = media.url || media.path || media.src;
        if (url && typeof url === 'string') {
            const videoExtensions = /\.(mp4|mpeg|mpg|mov|avi|webm|flv|mkv|wmv|m4v)(\?.*)?$/i;
            return videoExtensions.test(url);
        }

        return false;
    }

    // If it's a string (URL), check file extension
    if (typeof media === 'string') {
        const videoExtensions = /\.(mp4|mpeg|mpg|mov|avi|webm|flv|mkv|wmv|m4v)(\?.*)?$/i;
        return videoExtensions.test(media);
    }

    return false;
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number | null | undefined, decimals: number = 2): string {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export type { Media, MediaObject };
