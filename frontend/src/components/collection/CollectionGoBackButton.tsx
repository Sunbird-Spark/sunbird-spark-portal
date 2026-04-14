import React, { useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { useAppI18n } from "@/hooks/useAppI18n";

interface CollectionGoBackButtonProps {
  batchIdParam: string | undefined;
}

export const CollectionGoBackButton: React.FC<CollectionGoBackButtonProps> = ({ batchIdParam }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useAppI18n();

  const backToRef = useRef<string>((location.state as { from?: string } | null)?.from ?? '/explore');

  return (
    <button
      onClick={() => navigate(backToRef.current)}
      className="flex items-center gap-2 text-sunbird-brick text-sm font-medium mb-6 hover:opacity-80 transition-opacity"
      data-edataid="collection-go-back"
      data-pageid={batchIdParam ? 'course-consumption' : 'collection-detail'}
    >
      <FiArrowLeft className="w-4 h-4" />
      {t("button.goBack")}
    </button>
  );
};
