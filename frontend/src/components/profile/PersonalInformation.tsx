import { FiEdit2 } from "react-icons/fi";

const personalInfoData = {
    fullName: "Prachi Desai",
    emailId: "prachi@gmail.com",
    mobileNumber: "1234567890",
    designation: "Software Engineer",
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
            <div className="personal-info-grid">
                {/* Full Name */}
                <div className="personal-info-field">
                    <label className="personal-info-label">
                        Full Name
                    </label>
                    <div className="personal-info-value-container">
                        <span className="personal-info-value">
                            {personalInfoData.fullName}
                        </span>
                    </div>
                </div>

                {/* Email ID */}
                <div className="personal-info-field">
                    <label className="personal-info-label">
                        Email ID
                    </label>
                    <div className="personal-info-value-container">
                        <span className="personal-info-value">
                            {personalInfoData.emailId}
                        </span>
                    </div>
                </div>

                {/* Mobile Number */}
                <div className="personal-info-field">
                    <label className="personal-info-label">
                        Mobile Number
                    </label>
                    <div className="personal-info-value-container">
                        <span className="personal-info-value">
                            {personalInfoData.mobileNumber}
                        </span>
                    </div>
                </div>

                {/* Designation */}
                <div className="personal-info-field">
                    <label className="personal-info-label">
                        Designation
                    </label>
                    <div className="personal-info-value-container">
                        <span className="personal-info-value">
                            {personalInfoData.designation}
                        </span>
                    </div>
                </div>

                {/* District */}
                <div className="personal-info-field">
                    <label className="personal-info-label">
                        District
                    </label>
                    <div className="personal-info-value-container">
                        <span className="personal-info-value">
                            {personalInfoData.district}
                        </span>
                    </div>
                </div>

                {/* State */}
                <div className="personal-info-field">
                    <label className="personal-info-label">
                        State
                    </label>
                    <div className="personal-info-value-container">
                        <span className="personal-info-value">
                            {personalInfoData.state}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PersonalInformation;
