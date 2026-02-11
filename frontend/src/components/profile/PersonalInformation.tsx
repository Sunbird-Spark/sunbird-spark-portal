import { FiEdit2 } from "react-icons/fi";

interface PersonalInformationProps {
    user: any;
}

const PersonalInformation = ({ user }: PersonalInformationProps) => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const displayEmail = user.maskedEmail || user.email;
    const displayPhone = user.maskedPhone || user.phone || "N/A";

    // Extract district and state from profileLocation
    const district = user.profileLocation?.find((loc: any) => loc.type === "district")?.id || "N/A";
    const state = user.profileLocation?.find((loc: any) => loc.type === "state")?.id || "N/A";

    // Recovery email (if available)
    const alternateEmail = user.recoveryEmail || "N/A";

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
                    <dd className="personal-info-value-container">
                        <span className="personal-info-value">
                            {fullName}
                        </span>
                    </dd>
                </div>

                {/* Mobile Number */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        Mobile Number
                    </dt>
                    <dd className="personal-info-value-container">
                        <span className="personal-info-value">
                            {displayPhone}
                        </span>
                    </dd>
                </div>

                {/* Email ID */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        Email ID
                    </dt>
                    <dd className="personal-info-value-container">
                        <span className="personal-info-value">
                            {displayEmail}
                        </span>
                    </dd>
                </div>

                {/* Alternate Email ID */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        Alternate Email ID
                    </dt>
                    <dd className="personal-info-value-container">
                        <span className="personal-info-value">
                            {alternateEmail}
                        </span>
                    </dd>
                </div>

                {/* District */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        District
                    </dt>
                    <dd className="personal-info-value-container">
                        <span className="personal-info-value">
                            {district}
                        </span>
                    </dd>
                </div>

                {/* State */}
                <div className="personal-info-field">
                    <dt className="personal-info-label">
                        State
                    </dt>
                    <dd className="personal-info-value-container">
                        <span className="personal-info-value">
                            {state}
                        </span>
                    </dd>
                </div>
            </dl>
        </div>
    );
};

export default PersonalInformation;
