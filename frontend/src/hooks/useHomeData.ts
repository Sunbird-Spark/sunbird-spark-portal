import { useQuery } from '@tanstack/react-query';
import { useAppI18n } from "@/hooks/useAppI18n";

// Mock fetch function
const fetchHomeData = async () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                welcomeMessage: "Welcome to your dashboard",
            });
        }, 600);
    });
};

export const useHomeData = () => {
    const { currentCode } = useAppI18n();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['home-data', currentCode],
        queryFn: fetchHomeData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return { loading: isLoading, error, data, refetch };
};
