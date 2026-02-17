import { useState, useEffect, useMemo } from 'react';
import { HttpService } from '../services/HttpService';
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useAppI18n } from "@/hooks/useAppI18n";
import type { ApiFaqCategory } from "@/types/helpSupport";

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

/**
 * Shared hook that fetches FAQ data from the portalFaqURL setting
 * and returns the categories array along with loading/error states.
 */
export const useHelpFaqData = () => {
  const { currentCode } = useAppI18n();
  const { data: settingResponse } = useSystemSetting("portalFaqURL");
  const faqUrl = settingResponse?.data?.response?.value || settingResponse?.data?.value;
  const { data: faqData, loading, error } = useFaqData(faqUrl, currentCode || "en");

  const categories: ApiFaqCategory[] = useMemo(
    () => (faqData as any)?.categories ?? [],
    [faqData]
  );

  return { categories, loading, error };
};
