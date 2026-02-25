import { useState } from "react";
import { FiX, FiStar } from "react-icons/fi";
import { $t } from "@project-sunbird/telemetry-sdk";
import ratingPopupCheck from "@/assets/rating-popup-check.svg";

interface ContentMeta {
    id: string;
    type?: string;
    ver?: string;
}

interface RatingDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit?: (rating: number) => void;
    contentMeta?: ContentMeta;
}

const RatingDialog = ({ open, onClose, onSubmit, contentMeta }: RatingDialogProps) => {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);

    if (!open) return null;

    const handleSubmit = () => {
        if (contentMeta?.id) {
            $t.feedback(
                {
                    edata: { rating },
                    object: {
                        id: contentMeta.id,
                        type: contentMeta.type ?? "Content",
                        ver: contentMeta.ver ?? "1",
                    },
                }
            );
        }
        onSubmit?.(rating);
        setRating(0);
        onClose();
    };

    const handleClose = () => {
        setRating(0);
        onClose();
    };

    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 rounded-xl">
            <div
                className="bg-[#FFFFFF] rounded-[1rem] flex flex-col items-center justify-center text-center w-full h-full relative p-4 sm:p-6 md:p-8 lg:p-10"
                style={{ boxShadow: "2px 2px 30px 0px #00000014" }}
            >
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 md:top-5 md:right-5 text-sunbird-brick hover:opacity-70 transition-opacity"
                    aria-label="Close"
                >
                    <FiX className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Seal badge */}
                <img
                    src={ratingPopupCheck}
                    alt=""
                    className="w-12 h-12 sm:w-16 sm:h-16 md:w-[6.875rem] md:h-[6.875rem] mx-auto mb-3 sm:mb-4 md:mb-6"
                />

                {/* Title */}
                <h2 className="font-rubik font-medium text-[1rem] sm:text-[1.25rem] md:text-[1.5rem] leading-snug tracking-[0px] text-center text-[#222222] mb-1 sm:mb-2">
                    We would love to hear from you
                </h2>

                {/* Subtitle */}
                <p className="font-rubik font-normal text-[0.75rem] sm:text-[0.875rem] md:text-[1rem] leading-[1.5rem] tracking-[0px] text-center text-[#222222] mb-4 sm:mb-5 md:mb-6">
                    How was your learning experience today?
                </p>

                {/* Star rating */}
                <div className="flex gap-1 sm:gap-2 mb-6 sm:mb-10 md:mb-16">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        >
                            <FiStar
                                style={{ width: "clamp(18px, 3vw, 27px)", height: "clamp(18px, 3vw, 27px)" }}
                                className={`transition-colors ${
                                    star <= (hovered || rating)
                                        ? "fill-sunbird-brick text-sunbird-brick"
                                        : "fill-[#D4D4D4] text-[#D4D4D4]"
                                }`}
                            />
                        </button>
                    ))}
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className="bg-sunbird-brick text-white font-rubik font-medium text-[0.875rem] sm:text-[1rem] px-8 sm:px-10 md:px-14 py-2 sm:py-2.5 md:py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default RatingDialog;
