import axios from 'axios';

/**
 * Generic service for fetching data from blob storage
 * Can be used for any type of content stored in blob storage (FAQs, assets, etc.)
 */
export class BlobStorageService {
  /**
   * Fetches JSON data from a blob storage URL
   * @param url - Full URL to the JSON file in blob storage
   * @returns Parsed JSON data
   */
  async fetchJson<T = any>(url: string): Promise<T> {
    try {
      const response = await axios.get<T>(url);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch JSON from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetches JSON data with automatic fallback to a default URL
   * @param primaryUrl - Primary URL to fetch from
   * @param fallbackUrl - Fallback URL if primary fails
   * @returns Parsed JSON data from primary or fallback URL
   */
  async fetchJsonWithFallback<T = any>(
    primaryUrl: string,
    fallbackUrl: string
  ): Promise<T | null> {
    try {
      return await this.fetchJson<T>(primaryUrl);
    } catch (error) {
      console.warn(`Primary URL failed, trying fallback: ${fallbackUrl}`);
      try {
        return await this.fetchJson<T>(fallbackUrl);
      } catch (fallbackError) {
        console.error('Both primary and fallback URLs failed:', fallbackError);
        return null;
      }
    }
  }

  /**
   * Fetches text content from a blob storage URL
   * @param url - Full URL to the text file in blob storage
   * @returns Text content
   */
  async fetchText(url: string): Promise<string> {
    try {
      const response = await axios.get<string>(url, {
        responseType: 'text',
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch text from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Fetches binary data (blob) from a blob storage URL
   * @param url - Full URL to the file in blob storage
   * @returns Blob data
   */
  async fetchBlob(url: string): Promise<Blob> {
    try {
      const response = await axios.get<Blob>(url, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch blob from ${url}:`, error);
      throw error;
    }
  }
  

  /**
   * Constructs a URL for a language-specific file
   * @param baseUrl - Base URL of the blob storage
   * @param fileName - File name pattern (e.g., 'faq')
   * @param languageCode - Language code (e.g., 'en', 'es')
   * @param extension - File extension (default: 'json')
   * @returns Constructed URL
   */
  buildLanguageUrl(
    baseUrl: string,
    fileName: string,
    languageCode: string,
    extension: string = 'json'
  ): string {
    return `${baseUrl}/${fileName}-${languageCode}.${extension}`;
  }
}
