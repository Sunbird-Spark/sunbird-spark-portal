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

const appendGhostDiv = (id: string, width: number, height: number): HTMLDivElement => {
    const divElement = document.createElement('div');
    divElement.id = id;
    divElement.style.position = 'absolute';
    divElement.style.left = `-${width}px`;
    divElement.style.top = '0';
    divElement.style.height = `${height}px`;
    divElement.style.width = `${width}px`;
    divElement.style.letterSpacing = 'normal';
    document.body.appendChild(divElement);
    return divElement;
};

const extractFileName = (template: string): string => {
    if (template.trim().startsWith('<')) return 'certificate';
    try {
        const fileName = template.split('/').pop();
        return fileName?.includes('.svg') ? fileName.split('.svg')[0] || 'certificate' : 'certificate';
    } catch {
        return 'certificate';
    }
};

export const convertSvgToOutput = async (
    input: string | HTMLElement,
    options?: ConverterOptions
): Promise<void> => {
    const config = {
        width: options?.width ?? 1060,
        height: options?.height ?? 750,
        fileName: options?.fileName,
        format: options?.format ?? 'pdf',
        delay: options?.delay ?? 500
    };

    let element: HTMLElement;
    let isGhost = false;

    if (typeof input === 'string') {
        let template = input.startsWith('data:image/svg+xml,')
            ? decodeURIComponent(input.replace(/data:image\/svg\+xml,/, '')).replace(/<!--\s*[a-zA-Z0-9-]*\s*-->/g, '')
            : input;

        if (!config.fileName) config.fileName = extractFileName(input);

        // Sanitize SVG to prevent XSS attacks
        template = DOMPurify.sanitize(template, {
            USE_PROFILES: { svg: true, svgFilters: true },
            ADD_TAGS: ['svg', 'path', 'rect', 'circle', 'text', 'g', 'defs', 'image', 'use'],
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
        });

        element = appendGhostDiv('sbCertificateDownloadAsPdfCanvas' + Date.now(), config.width, config.height);
        element.innerHTML = template;

        isGhost = true;
    } else {
        element = input;
        if (!config.fileName) config.fileName = 'certificate';
    }

    if (config.delay > 0) await new Promise(resolve => setTimeout(resolve, config.delay));

    try {
        const dataUrl = await htmlToImage.toPng(element, {
            width: config.width,
            height: config.height,
            skipFonts: true,
            style: { left: '0', right: '0', bottom: '0', top: '0' }
        });

        if (config.format === 'png') {
            const link = document.createElement('a');
            link.download = `${config.fileName}.png`;
            link.href = dataUrl;
            link.click();
        } else {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: [config.width / 1.33, config.height / 1.33]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, config.width / 1.33, config.height / 1.33);
            pdf.save(`${config.fileName}.pdf`);
        }
    } catch (error) {
        console.error('Error converting SVG:', error);
        throw error;
    } finally {
        if (isGhost) element.remove();
    }
};
