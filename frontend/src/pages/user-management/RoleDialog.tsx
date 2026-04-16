import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import { RoleItem, UserRoleInfo, OrganisationOption } from "@/services/UserManagementService";
import { useAppI18n } from "@/hooks/useAppI18n";
import "./user-management.css";

export interface RoleDialogState {
  open: boolean;
  userId: string;
  operation: "add" | "update";
  currentRole?: UserRoleInfo;
}

interface RoleDialogProps {
  dialogState: RoleDialogState;
  availableRoles: RoleItem[];
  existingRoleIds: string[];
  selectedRole: string;
  organisationId: string;
  isSavingRole: boolean;
  onClose: () => void;
  onSave: () => void;
  onSelectedRoleChange: (val: string) => void;
  onOrganisationIdChange: (val: string) => void;
  userOrganisations: OrganisationOption[];
}

export const RoleDialog = ({
  dialogState,
  availableRoles,
  existingRoleIds,
  selectedRole,
  organisationId,
  isSavingRole,
  onClose,
  onSave,
  onSelectedRoleChange,
  onOrganisationIdChange,
  userOrganisations,
}: RoleDialogProps) => {
  const selectableRoles = availableRoles.filter((r) => !existingRoleIds.includes(r.id));
  const { t } = useAppI18n();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSavingRole) {
        onClose();
      }
    };

    if (dialogState.open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dialogState.open, isSavingRole, onClose]);

  if (!dialogState.open) return null;

  const dialogTitle = dialogState.operation === "add"
    ? t("userManagement.roleDialog.addTitle")
    : t("userManagement.roleDialog.editTitle");

  return (
    <div
      className="um-dialog-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={dialogTitle}
    >
      <div className="um-dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="um-dialog-header">
          <h2 className="um-dialog-title">{dialogTitle}</h2>
          <button
            className="um-dialog-close-btn"
            onClick={onClose}
            disabled={isSavingRole}
            aria-label={t("userManagement.roleDialog.close")}
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="um-dialog-body">
          <div className="um-form-field">
            <label className="um-form-label" htmlFor="um-role-select">
              {t("userManagement.roleDialog.roleLabel")} <span className="um-required">*</span>
            </label>
            <Select value={selectedRole} onValueChange={onSelectedRoleChange} disabled={isSavingRole}>
              <SelectTrigger id="um-role-select" data-testid="um-role-select" className="um-select-trigger">
                <SelectValue placeholder={t("userManagement.roleDialog.selectRole")} />
              </SelectTrigger>
              <SelectContent>
                {selectableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="um-form-field">
            <label className="um-form-label" htmlFor="um-org-select">
              {t("userManagement.roleDialog.orgLabel")} <span className="um-required">*</span>
            </label>
            <Select value={organisationId} onValueChange={onOrganisationIdChange} disabled={isSavingRole}>
              <SelectTrigger id="um-org-select" data-testid="um-org-select" className="um-select-trigger">
                <SelectValue placeholder={userOrganisations.length > 0 ? t("userManagement.roleDialog.selectOrg") : t("userManagement.roleDialog.noOrgs")} />
              </SelectTrigger>
              <SelectContent>
                {userOrganisations.length === 0 ? (
                  <SelectItem value="none" disabled>
                    {t("userManagement.roleDialog.noOrgs")}
                  </SelectItem>
                ) : (
                  userOrganisations.map((org) => (
                    <SelectItem key={org.organisationId} value={org.organisationId}>
                      {org.orgName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {userOrganisations.length === 0 && (
              <p className="text-[0.8125rem] text-sunbird-brick mt-1.5 font-medium">
                {t("userManagement.roleDialog.noOrgHint")}
              </p>
            )}
          </div>
        </div>
        <div className="um-dialog-footer">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSavingRole}>
            {t("userManagement.roleDialog.cancel")}
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSavingRole || userOrganisations.length === 0} className="um-save-btn">
            {isSavingRole
              ? t("userManagement.roleDialog.saving")
              : dialogState.operation === "add"
                ? t("userManagement.roleDialog.add")
                : t("userManagement.roleDialog.save")}
          </Button>
        </div>
      </div>
    </div>
  );
};
