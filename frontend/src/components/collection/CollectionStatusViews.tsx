import React from "react";
import PageLoader from "@/components/common/PageLoader";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CollectionStatusViewsProps {
  showLoading: boolean;
  isError: boolean;
  error: any;
  collectionDataFromApi: any;
  refetch: () => void;
}

export const CollectionStatusViews: React.FC<CollectionStatusViewsProps> = ({
  showLoading,
  isError,
  error,
  collectionDataFromApi,
  refetch,
}) => {
  const { t } = useAppI18n();

  if (showLoading) {
    return <PageLoader message={t("loading")} fullPage={false} />;
  }

  if (isError && error) {
    return (
      <PageLoader
        error={error.message}
        onRetry={() => refetch()}
        fullPage={false}
      />
    );
  }

  if (collectionDataFromApi == null) {
    return (
      <PageLoader
        error={t("collection.notFound")}
        onRetry={() => refetch()}
        fullPage={false}
      />
    );
  }

  return null;
};
