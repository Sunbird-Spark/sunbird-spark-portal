import Avatar from "react-avatar";

interface ProfileCardProps {
    user: any;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
    const fullName = `${user.firstName} ${user.lastName}`;
    const displayEmail = user.maskedEmail || user.email;

    return (
        <div className="profile-card">
            {/* Profile Photo with Ring using react-avatar */}
            <div className="profile-avatar-wrapper">
                <div className="profile-avatar-ring">
                    <Avatar
                        name={fullName}
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
                {fullName}
            </h2>

            {/* Sunbird ID */}
            <p className="profile-id-text">
                Sunbird ID : {displayEmail}
            </p>
        </div>
    );
};

export default ProfileCard;
