import React from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CollectionGoBackButtonProps {
  batchIdParam: string | undefined;
}

export const CollectionGoBackButton: React.FC<CollectionGoBackButtonProps> = ({ batchIdParam }) => {
  const navigate = useNavigate();
  const { t } = useAppI18n();

  return (
    <button
      onClick={() => navigate(-1)}
      className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
      data-edataid="collection-go-back"
      data-pageid={batchIdParam ? 'course-consumption' : 'collection-detail'}
    >
      <FiArrowLeft className="w-4 h-4" />
      {t("button.goBack")}
    </button>
  );
};
