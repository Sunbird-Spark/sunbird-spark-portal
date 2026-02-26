import React from "react";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { UserSearchResult, UserRoleInfo } from "@/services/UserManagementService";
import "./user-management.css";

interface UserRoleTableProps {
  searchResults: UserSearchResult[];
  searchQuery: string;
  onOpenDeleteDialog: (userId: string, roleInfo: UserRoleInfo) => void;
  onOpenAddRoleDialog: (userId: string) => void;
}

export const UserRoleTable = ({
  searchResults,
  searchQuery,
  onOpenDeleteDialog,
  onOpenAddRoleDialog,
}: UserRoleTableProps) => {
  const getStatusLabel = (status: number) => (status === 1 ? "Active" : "Inactive");
  const getUserDisplayName = (user: UserSearchResult) =>
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.userName;

  if (searchResults.length === 0) {
    return (
      <div className="um-empty-state">
        <p className="um-empty-text">No users found for "<strong>{searchQuery}</strong>"</p>
      </div>
    );
  }

  return (
    <div className="um-table-wrapper">
      <table className="um-table">
        <thead>
          <tr className="um-table-head-row">
            <th className="um-th um-th-narrow">#</th>
            <th className="um-th">Name</th>
            <th className="um-th">Email</th>
            <th className="um-th">Username</th>
            <th className="um-th um-th-narrow">Status</th>
            <th className="um-th">Current Roles</th>
            <th className="um-th um-th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {searchResults.map((user, idx) => {
            const userId = user.userId || user.id;
            return (
            <tr key={userId} className="um-table-row">
              <td className="um-td um-td-narrow um-td-muted">{idx + 1}</td>
              <td className="um-td um-td-name">{getUserDisplayName(user)}</td>
              <td className="um-td um-td-email">{user.maskedEmail || user.email || "—"}</td>
              <td className="um-td">
                <span className="font-medium text-sunbird-obsidian">
                  {user.userName}
                </span>
              </td>
              <td className="um-td um-td-narrow">
                <span className={`um-status-badge ${user.status === 1 ? "um-status-active" : "um-status-inactive"}`}>
                  {getStatusLabel(user.status)}
                </span>
              </td>
              <td className="um-td">
                {user.roles && user.roles.length > 0 ? (
                  <div className="um-roles-list">
                    {user.roles.map((roleInfo) => (
                      <div key={`${roleInfo.role}-${roleInfo.scope?.[0]?.organisationId}`} className="um-role-chip">
                        <span className="um-role-label">{roleInfo.role}</span>
                        {roleInfo.role !== 'PUBLIC' && (
                          <button className="um-role-action-btn um-role-delete-btn" title="Remove role" onClick={() => onOpenDeleteDialog(userId, roleInfo)} aria-label={`Remove role ${roleInfo.role}`}>
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="um-no-roles">No roles assigned</span>
                )}
              </td>
              <td className="um-td um-td-actions">
                <Button size="sm" onClick={() => onOpenAddRoleDialog(userId)} className="um-add-role-btn" title="Add a new role">
                  <FiPlus size={14} />
                  <span>Add Role</span>
                </Button>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
