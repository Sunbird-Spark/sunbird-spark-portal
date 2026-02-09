import Avatar from "react-avatar";

const ProfileCard = () => {
    return (
        <div className="bg-white rounded-[1.25rem] p-6 flex flex-col items-center">
            {/* Profile Photo with Ring using react-avatar */}
            <div className="relative mb-3">
                <div className="w-[11.9375rem] h-[11.9375rem] rounded-full border-4 border-sunbird-ginger p-0.5 flex items-center justify-center overflow-hidden">
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
            <button className="text-sm font-medium text-sunbird-brick hover:text-sunbird-brick/90 mb-4 transition-colors">
                Update Photo
            </button>

            {/* Name */}
            <h2 className="text-xl font-medium text-foreground mb-1 text-center">
                Prachi desai
            </h2>

            {/* Sunbird ID */}
            <p className="text-sm text-muted-foreground text-center">
                Sunbird ID : prachi@gmail.com
            </p>
        </div>
    );
};

export default ProfileCard;
