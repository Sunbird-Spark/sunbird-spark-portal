import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('should return empty string for empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should allow safe HTML tags', () => {
    const input = '<b>Bold</b> <i>Italic</i> <u>Underline</u>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<b>Bold</b>');
    expect(result).toContain('<i>Italic</i>');
    expect(result).toContain('<u>Underline</u>');
  });

  it('should allow links with href attribute', () => {
    const input = '<a href="/test">Link</a>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<a href="/test">Link</a>');
  });

  it('should allow lists', () => {
    const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 2</li>');
    expect(result).toContain('</ul>');
  });

  it('should remove script tags', () => {
    const input = '<b>Safe</b> <script>alert("XSS")</script>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<b>Safe</b>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('should remove event handlers', () => {
    const input = '<div onclick="alert(\'XSS\')">Click me</div>';
    const result = sanitizeHtml(input);
    
    expect(result).not.toContain('onclick');
    expect(result).not.toContain('alert');
  });

  it('should remove javascript: URLs', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Bad Link</a>';
    const result = sanitizeHtml(input);
    
    expect(result).not.toContain('javascript:');
    expect(result).not.toContain('alert');
  });

  it('should sanitize img tags with onerror', () => {
    const input = '<img src="x" onerror="alert(\'XSS\')">';
    const result = sanitizeHtml(input);
    
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
  });

  it('should allow paragraph and span tags', () => {
    const input = '<p>Paragraph</p> <span>Span</span>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<p>Paragraph</p>');
    expect(result).toContain('<span>Span</span>');
  });

  it('should allow br tags', () => {
    const input = 'Line 1<br>Line 2';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<br>');
  });

  it('should handle complex nested HTML', () => {
    const input = '<div><p>Text with <b>bold</b> and <i>italic</i></p><ul><li>Item</li></ul></div>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
    expect(result).toContain('<li>Item</li>');
  });

  it('should remove iframe tags', () => {
    const input = '<iframe src="evil.com"></iframe>';
    const result = sanitizeHtml(input);
    
    expect(result).not.toContain('<iframe');
    expect(result).not.toContain('evil.com');
  });

  it('should handle mixed safe and unsafe content', () => {
    const input = '<b>Safe</b> <script>bad()</script> <i>Also safe</i>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<b>Safe</b>');
    expect(result).toContain('<i>Also safe</i>');
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('bad()');
  });

  it('should handle null or undefined input gracefully', () => {
    expect(sanitizeHtml(null as any)).toBe('');
    expect(sanitizeHtml(undefined as any)).toBe('');
  });

  it('should preserve whitespace in text content', () => {
    const input = '<p>Line 1\n\nLine 2</p>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('Line 1');
    expect(result).toContain('Line 2');
  });

  it('should handle data URIs in images', () => {
    const input = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==">';
    const result = sanitizeHtml(input);
    
    // DOMPurify should allow data URIs for images by default
    expect(result).toContain('<img');
  });

  it('should handle HTML entities correctly', () => {
    const input = '<p>&lt;script&gt;alert("XSS")&lt;/script&gt;</p>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('&lt;');
    expect(result).toContain('&gt;');
    // HTML entities may be decoded by DOMPurify
    expect(result).toContain('alert');
  });

  it('should allow strong and em tags', () => {
    const input = '<strong>Strong</strong> <em>Emphasis</em>';
    const result = sanitizeHtml(input);
    
    expect(result).toContain('<strong>Strong</strong>');
    expect(result).toContain('<em>Emphasis</em>');
  });

  it('should handle very long HTML strings', () => {
    const longContent = '<p>' + 'a'.repeat(10000) + '</p>';
    const result = sanitizeHtml(longContent);
    
    expect(result).toContain('<p>');
    expect(result.length).toBeGreaterThan(10000);
  });
});
