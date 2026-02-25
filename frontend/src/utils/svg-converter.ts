import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import DOMPurify from 'dompurify';
import { truncate, last } from 'lodash';

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

const sanitizeFileName = (fileName: string): string => {
    // eslint-disable-next-line no-control-regex
    return truncate(fileName.replace(/[/\\:*?"<>|\x00-\x1f]/g, '_').trim(), { length: 200, omission: '' }) || 'certificate';
};

const extractFileName = (template: string): string => {
    if (template.trim().startsWith('<')) return 'certificate';
    try {
        const fileName = last(template.split('/'));
        return fileName?.includes('.svg') ? fileName.split('.svg')[0]! : 'certificate';
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

        config.fileName = sanitizeFileName(config.fileName || extractFileName(input));

        const transPx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const deadDomains = /https?:\/\/(?:obj\.dev\.sunbirded\.org|via\.placeholder\.com)[^"'\s\\]*/g;

        template = template
            .replace(/@font-face\s*{[^}]*url\(["']?https?:\/\/(?:obj\.dev\.sunbirded\.org|via\.placeholder\.com)[^)]*["']?\)[^}]*}/g, '')
            .replace(/@import\s+url\(["']?https?:\/\/(?:obj\.dev\.sunbirded\.org|via\.placeholder\.com)[^)]*["']?\)[^;]*;/g, '')
            .replace(/(?:xlink:)?href="https?:\/\/(?:via\.placeholder\.com|obj\.dev\.sunbirded\.org)[^"]*"/g, `href="${transPx}"`)
            .replace(deadDomains, transPx);

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
        config.fileName = sanitizeFileName(config.fileName || 'certificate');
    }

    if (config.delay > 0) await new Promise(resolve => setTimeout(resolve, config.delay));

    try {
        const transPx = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
        const images = element.querySelectorAll('image, img');

        images.forEach((img) => {
            const href = img.getAttribute('href') || img.getAttribute('xlink:href') || (img as HTMLImageElement).src;
            if (!href || href === '{{qrCode}}' || img.id === 'QrCode' ||
                href.includes('via.placeholder.com') || href.includes('dev.sunbirded.org')) {
                img.setAttribute('href', transPx);
                img.setAttribute('xlink:href', transPx);
                if (img instanceof HTMLImageElement) img.src = transPx;
                img.addEventListener('error', (e) => e.stopPropagation());
            }
        });

        const dataUrl = await htmlToImage.toPng(element, {
            width: config.width,
            height: config.height,
            skipFonts: true,
            imagePlaceholder: transPx,
            style: { left: '0', right: '0', bottom: '0', top: '0' },
            filter: (node: HTMLElement) => {
                if (node.tagName?.toLowerCase() === 'link') {
                    const href = (node as HTMLLinkElement).href;
                    if (href?.includes('via.placeholder.com') || href?.includes('dev.sunbirded.org')) return false;
                }
                if (['img', 'image'].includes(node.tagName?.toLowerCase())) {
                    const src = (node as HTMLImageElement).src || node.getAttribute('href') || node.getAttribute('xlink:href');
                    if (!src || src === '{{qrCode}}' || node.id === 'QrCode') return false;
                }
                return true;
            }
        });

        // Ensure the filename is sanitized right before saving to prevent bad characters
        const finalFileName = sanitizeFileName(config.fileName || 'certificate');

        if (config.format === 'png') {
            const link = document.createElement('a');
            link.download = `${finalFileName}.png`;
            link.href = dataUrl;
            link.click();
        } else {
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'pt',
                format: [config.width / 1.33, config.height / 1.33]
            });
            pdf.addImage(dataUrl, 'PNG', 0, 0, config.width / 1.33, config.height / 1.33);
            pdf.save(`${finalFileName}.pdf`);
        }
    } catch (error) {
        console.error('Error converting SVG:', error);
        throw error;
    } finally {
        if (isGhost) element.remove();
    }
};
