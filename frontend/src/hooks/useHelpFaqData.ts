import { useMemo } from "react";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useFaqData } from "@/hooks/useFaqData";
import { useAppI18n } from "@/hooks/useAppI18n";
import type { ApiFaqCategory } from "@/types/helpSupport";

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
