import { FiEdit2 } from "react-icons/fi";
import { UserProfile } from "@/types/userTypes";
import _ from 'lodash';

interface PersonalInformationProps {
    user: UserProfile;
}

const PersonalInformation = ({ user }: PersonalInformationProps) => {
    const firstName = _.get(user, 'firstName', '');
    const lastName = _.get(user, 'lastName', '');
    const fullName = `${firstName} ${lastName}`;
    const truncatedName = fullName.length > 20 ? `${fullName.substring(0, 20)}...` : fullName;

    // Safely access email and phone properties
    const maskedEmail = _.get(user, 'maskedEmail');
    const email = _.get(user, 'email');
    const maskedPhone = _.get(user, 'maskedPhone');
    const recoveryEmail = _.get(user, 'recoveryEmail');

    const displayEmail = maskedEmail || email || "";
    const displayPhone = maskedPhone || "";

    // Recovery email (if available) - Mapped to Alternate Email ID
    const alternateEmail = recoveryEmail || "";

    return (
        <div className="personal-info-card">
            {/* Header with Edit */}
            <div className="personal-info-header">
                <div className="personal-info-title-wrapper">
                    <div className="personal-info-accent" />
                    <h2 className="personal-info-title">
                        Personal Information
                    </h2>
                </div>
                <button className="personal-info-edit-btn">
                    <FiEdit2 className="w-3.5 h-3.5" />
                    Edit
                </button>
            </div>

            {/* Form Fields Grid */}
            <dl className="personal-info-grid">
                {/* Full Name */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        Full Name
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span className="personal-info-value block truncate" title={fullName}>
                            {truncatedName}
                        </span>
                    </dd>
                </div>

                {/* Mobile Number */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        Mobile Number
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span className={`personal-info-value block truncate ${!displayPhone ? 'text-sunbird-gray-75' : ''}`} title={displayPhone || "Mobile Number"}>
                            {displayPhone || "Mobile Number"}
                        </span>
                    </dd>
                </div>

                {/* Email ID */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        Email ID
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span
                            className={`personal-info-value block truncate ${!displayEmail ? 'text-sunbird-gray-75' : ''}`}
                            title={displayEmail || "Email ID"}
                        >
                            {displayEmail || "Email ID"}
                        </span>
                    </dd>
                </div>

                {/* Alternate Email ID */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        Alternate Email ID
                    </dt>
                    <dd className="personal-info-value-container min-w-0">
                        <span className={`personal-info-value block truncate ${!alternateEmail ? 'text-sunbird-gray-75' : ''}`} title={alternateEmail || "Alternate Email ID"}>
                            {alternateEmail || "Alternate Email ID"}
                        </span>
                    </dd>
                </div>
            </dl>
        </div>
    );
};

export default PersonalInformation;
