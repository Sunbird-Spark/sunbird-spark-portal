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
        <div className="rating-dialog-overlay">
            <div className="rating-dialog-card">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="rating-dialog-close-btn"
                    aria-label="Close"
                >
                    <FiX className="rating-dialog-close-icon" />
                </button>

                {/* Seal badge */}
                <img
                    src={ratingPopupCheck}
                    alt=""
                    className="rating-dialog-badge"
                />

                {/* Title */}
                <h2 className="rating-dialog-title">
                    We would love to hear from you
                </h2>

                {/* Subtitle */}
                <p className="rating-dialog-subtitle">
                    How was your learning experience today?
                </p>

                {/* Star rating */}
                <div className="rating-dialog-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onMouseEnter={() => setHovered(star)}
                            onMouseLeave={() => setHovered(0)}
                            onClick={() => setRating(star)}
                            className="rating-dialog-star-btn"
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
                    className="rating-dialog-submit-btn"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default RatingDialog;
