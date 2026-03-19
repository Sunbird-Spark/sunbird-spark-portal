import React from "react";
import RelatedContentSection from "@/components/collection/RelatedContentSection";
import FAQSection from "@/components/landing/FAQSection";

interface CollectionSecondarySectionProps {
  searchError: boolean;
  searchErrorObj: any;
  searchFetching: boolean;
  relatedContentItems: any[];
  searchRefetch: () => void;
}

export const CollectionSecondarySection: React.FC<CollectionSecondarySectionProps> = ({
  searchError,
  searchErrorObj,
  searchFetching,
  relatedContentItems,
  searchRefetch,
}) => {
  return (
    <>
      {/* Related Content Section */}
      <RelatedContentSection
        searchError={searchError}
        searchErrorObj={searchErrorObj}
        searchFetching={searchFetching}
        relatedContentItems={relatedContentItems}
        searchRefetch={searchRefetch}
      />

      <div className="mt-16">
        <FAQSection />
      </div>
    </>
  );
};
