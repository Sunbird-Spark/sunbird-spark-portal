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

    const controller = new AbortController();
    const signal = controller.signal;
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');


    const fetchData = async () => {
      setLoading(true);
      setError(null);

      const primaryUrl = `${normalizedBaseUrl}/faq-${languageCode}.json`;
      const fallbackUrl = `${normalizedBaseUrl}/faq-en.json`;

      try {
        const result = await httpService.get(primaryUrl, { signal });
        if (!signal.aborted) {
          setData(result);
        }
      } catch (err) {
        if (HttpService.isCancel(err)) {
          return;
        }

        if (languageCode !== 'en') {
          try {
            const fallbackResult = await httpService.get(fallbackUrl, { signal });
            if (!signal.aborted) {
              setData(fallbackResult);
            }
          } catch (fallbackErr) {
            if (HttpService.isCancel(fallbackErr)) {
              return;
            }
            console.error('Failed to fetch FAQ data from both primary and fallback URLs');
            if (!signal.aborted) {
              setError(fallbackErr);
              setData(null);
            }
          }
        } else {
          console.error('Failed to fetch FAQ data');
          if (!signal.aborted) {
            setError(err);
            setData(null);
          }
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [baseUrl, languageCode]);

  return { data, loading, error };
};
