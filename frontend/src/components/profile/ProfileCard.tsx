import Avatar from "react-avatar";

const ProfileCard = () => {
    return (
        <div className="profile-card">
            {/* Profile Photo with Ring using react-avatar */}
            <div className="profile-avatar-wrapper">
                <div className="profile-avatar-ring">
                    <Avatar
                        name="Prachi desai"
                        size="100%"
                        round={true}
                        maxInitials={2}
                        className="object-cover"
                    />
                </div>
            </div>

            {/* Update Photo Link */}
            <button className="profile-update-photo-btn">
                Update Photo
            </button>

            {/* Name */}
            <h2 className="profile-name">
                Prachi desai
            </h2>

            {/* Sunbird ID */}
            <p className="profile-id-text">
                Sunbird ID : prachi@gmail.com
            </p>
        </div>
    );
};

export default ProfileCard;
