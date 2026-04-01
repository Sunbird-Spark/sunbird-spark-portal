import React from "react";
import { FiTrash2, FiPlus } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { UserSearchResult, UserRoleInfo } from "@/services/UserManagementService";
import { useAppI18n } from "@/hooks/useAppI18n";
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
  const { t } = useAppI18n();
  const getStatusLabel = (status: number) =>
    status === 1 ? t("userManagement.userRoleTable.active") : t("userManagement.userRoleTable.inactive");
  const getUserDisplayName = (user: UserSearchResult) =>
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.userName;

  if (searchResults.length === 0) {
    return (
      <div className="um-empty-state">
        <p className="um-empty-text">
          {t("userManagement.userRoleTable.noUsersFound", { query: searchQuery })}
        </p>
      </div>
    );
  }

  return (
    <div className="um-table-wrapper">
      <table className="um-table">
        <thead>
          <tr className="um-table-head-row">
            <th className="um-th um-th-narrow">{t("userManagement.userRoleTable.colNumber")}</th>
            <th className="um-th">{t("userManagement.userRoleTable.colName")}</th>
            <th className="um-th">{t("userManagement.userRoleTable.colEmail")}</th>
            <th className="um-th">{t("userManagement.userRoleTable.colUsername")}</th>
            <th className="um-th um-th-narrow">{t("userManagement.userRoleTable.colStatus")}</th>
            <th className="um-th">{t("userManagement.userRoleTable.colCurrentRoles")}</th>
            <th className="um-th um-th-actions">{t("userManagement.userRoleTable.colActions")}</th>
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
                          <button
                            className="um-role-action-btn um-role-delete-btn"
                            title={t("userManagement.userRoleTable.removeRole")}
                            onClick={() => onOpenDeleteDialog(userId, roleInfo)}
                            aria-label={t("userManagement.userRoleTable.removeRoleAriaLabel").replace("{{role}}", roleInfo.role)}
                          >
                            <FiTrash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="um-no-roles">{t("userManagement.userRoleTable.noRolesAssigned")}</span>
                )}
              </td>
              <td className="um-td um-td-actions">
                <Button size="sm" onClick={() => onOpenAddRoleDialog(userId)} className="um-add-role-btn" title={t("userManagement.userRoleTable.addNewRole")}>
                  <FiPlus size={14} />
                  <span>{t("userManagement.addRole")}</span>
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
