import { useState, useEffect } from 'react';
import { HttpService } from '../services/HttpService';

const httpService = new HttpService();

export const useFaqData = (baseUrl: string | undefined, languageCode: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!baseUrl) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const primaryUrl = `${normalizedBaseUrl}/faq-${languageCode}.json`;
      const fallbackUrl = `${normalizedBaseUrl}/faq-en.json`;

      try {
        const result = await httpService.get(primaryUrl);
        setData(result);
      } catch (err) {
        if (languageCode !== 'en') {
          try {
            const fallbackResult = await httpService.get(fallbackUrl);
            setData(fallbackResult);
          } catch (fallbackErr) {
            console.error('Failed to fetch FAQ data from both primary and fallback URLs');
            setError(fallbackErr);
            setData(null);
          }
        } else {
          console.error('Failed to fetch FAQ data');
          setError(err);
          setData(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [baseUrl, languageCode]);

  return { data, loading, error };
};
