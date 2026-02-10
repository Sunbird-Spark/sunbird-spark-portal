import { FiEdit2 } from "react-icons/fi";

const personalInfoData = {
    fullName: "Prachi Desai",
    emailId: "prachi@gmail.com",
    mobileNumber: "1234567890",
    alternateEmailId: "pra1234@gmail.com",
    district: "Bengaluru",
    state: "Karnataka",
};

const PersonalInformation = () => {
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
                            {personalInfoData.fullName}
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
                            {personalInfoData.mobileNumber}
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
                            {personalInfoData.emailId}
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
                            {personalInfoData.alternateEmailId}
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
                            {personalInfoData.district}
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
                            {personalInfoData.state}
                        </span>
                    </dd>
                </div>
            </dl>
        </div>
    );
};

export default PersonalInformation;
