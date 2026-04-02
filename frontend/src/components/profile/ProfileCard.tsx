import Avatar from "react-avatar";
import _ from 'lodash';
import { UserProfile } from "@/types/userTypes";

interface ProfileCardProps {
    user: UserProfile;
}

const ProfileCard = ({ user }: ProfileCardProps) => {
    const fullName = [_.get(user, 'firstName'), _.get(user, 'lastName')].filter(Boolean).join(' ');
    const displayId = _.get(user, 'userName', '');

    const formatRole = (role: string) => {
        if (!role) return '';
        return role.split('_')
            .map(part => _.upperFirst(_.toLower(part)))
            .join(' ');
    };

    const rolesList = _.get(user, 'roles', []) || [];
    const roles = rolesList.map((r: any) => formatRole(_.get(r, 'role', '')));
    const roleChunks = _.chunk(roles, 3);

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

            {/* Name */}
            <h2 className="profile-name">
                {fullName}
            </h2>

            {/* Sunbird ID */}
            <p className="profile-id-text">
                Sunbird ID : {displayId}
            </p>

            {/* Roles */}
            {roles.length > 0 && (
                <div className="profile-roles-container mt-4 flex flex-col items-center gap-1 w-full">
                    {roleChunks.map((chunk) => (
                        <div key={chunk.join("|")} className="flex flex-wrap items-center justify-center gap-1 text-[0.875rem] text-sunbird-gray-75 w-full text-center">
                            {chunk.map((role, j) => (
                                <div key={role} className="flex items-center">
                                    <span className="font-rubik">{role}</span>
                                    {j < chunk.length - 1 && (
                                        <span className="mx-2 text-[0.5rem] text-sunbird-gray-75">•</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfileCard;
