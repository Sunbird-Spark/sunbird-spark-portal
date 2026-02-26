import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import DOMPurify from 'dompurify';

export interface ConverterOptions {
    width?: number;
    height?: number;
    fileName?: string;
    format?: 'png' | 'pdf';
    delay?: number;
}

const DEFAULT_WIDTH = 1060;
const DEFAULT_HEIGHT = 750;
const DEFAULT_FILENAME = 'certificate';
const DEFAULT_FORMAT = 'pdf';
const DEFAULT_DELAY = 500;
const PDF_SCALE_FACTOR = 1.33;

const appendGhostDiv = (id: string, width: number, height: number): HTMLDivElement => {
    const div = document.createElement('div');
    div.id = id;
    Object.assign(div.style, {
        position: 'absolute',
        left: `-${width}px`,
        top: '0',
        height: `${height}px`,
        width: `${width}px`,
        letterSpacing: 'normal'
    });
    document.body.appendChild(div);
    return div;
};

export const convertSvgToOutput = async (
    input: string | HTMLElement,
    options?: ConverterOptions
): Promise<void> => {
    const config = {
        width: options?.width ?? DEFAULT_WIDTH,
        height: options?.height ?? DEFAULT_HEIGHT,
        fileName: options?.fileName ?? DEFAULT_FILENAME,
        format: options?.format ?? DEFAULT_FORMAT,
        delay: options?.delay ?? DEFAULT_DELAY
    };

    let element: HTMLElement;
    let isGhost = false;
    let svgContent: string | null = null;

    if (typeof input === 'string') {
        let template = input.startsWith('data:image/svg+xml,')
            ? decodeURIComponent(input.replace(/data:image\/svg\+xml,/, '')).replace(/<!--\s*[a-zA-Z0-9-]*\s*-->/g, '')
            : input;

        template = DOMPurify.sanitize(template, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ['svg', 'path', 'rect', 'circle', 'text', 'g', 'defs', 'image', 'use'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
        });

        svgContent = template;
        element = appendGhostDiv('sbCertificateDownloadAsPdfCanvas' + Date.now(), config.width, config.height);
        element.innerHTML = template;
        isGhost = true;
    } else {
        element = input;
    }

    if (config.delay > 0) await new Promise(resolve => setTimeout(resolve, config.delay));

    const downloadImage = (dataUrl: string) => {
        if (config.format === 'png') {
            const link = document.createElement('a');
            link.download = `${config.fileName}.png`;
            link.href = dataUrl;
            link.click();
        } else {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: [config.width / PDF_SCALE_FACTOR, config.height / PDF_SCALE_FACTOR]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, config.width / PDF_SCALE_FACTOR, config.height / PDF_SCALE_FACTOR);
            pdf.save(`${config.fileName}.pdf`);
        }
    };

    try {
        const dataUrl = await htmlToImage.toPng(element, {
            width: config.width,
            height: config.height,
            skipFonts: true,
            style: { left: '0', right: '0', bottom: '0', top: '0' }
        });
        downloadImage(dataUrl);
    } catch (error) {
        console.error('Error converting SVG with html-to-image, trying direct SVG render:', error);
        if (!svgContent) throw error;

        const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        try {
            const img = new Image();
            img.width = config.width;
            img.height = config.height;

            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error('Failed to load SVG as image'));
                img.src = url;
            });

            const canvas = document.createElement('canvas');
            canvas.width = config.width;
            canvas.height = config.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, config.width, config.height);

            downloadImage(canvas.toDataURL('image/png'));
        } finally {
            URL.revokeObjectURL(url);
        }
    } finally {
        if (isGhost) element.remove();
    }
};
