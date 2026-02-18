import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import CreateBatchModal from "./CreateBatchModal";

interface BatchCardProps {
  collectionId: string;
}

const BatchCard = ({ collectionId }: BatchCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="w-full bg-white rounded-2xl shadow-[0_0.125rem_0.75rem_rgba(0,0,0,0.08)] border border-border px-5 py-4 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-['Rubik'] leading-tight">
          Manage batches for this course
        </p>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-sunbird-brick hover:bg-opacity-90 transition-colors rounded-lg px-3 py-1.5 self-start"
        >
          <FiPlus className="w-4 h-4" />
          Create Batch
        </button>
      </div>

      <CreateBatchModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        collectionId={collectionId}
      />
    </>
  );
};

export default BatchCard;
