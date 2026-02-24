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
import { RoleItem, UserRoleInfo } from "@/services/UserManagementService";
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
  selectedRole: string;
  organisationId: string;
  isSavingRole: boolean;
  onClose: () => void;
  onSave: () => void;
  onSelectedRoleChange: (val: string) => void;
  onOrganisationIdChange: (val: string) => void;
}

export const RoleDialog = ({
  dialogState,
  availableRoles,
  selectedRole,
  organisationId,
  isSavingRole,
  onClose,
  onSave,
  onSelectedRoleChange,
  onOrganisationIdChange,
}: RoleDialogProps) => {
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

  return (
    <div
      className="um-dialog-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={dialogState.operation === "add" ? "Add New Role" : "Edit Role"}
    >
      <div className="um-dialog-panel" onClick={(e) => e.stopPropagation()}>
        <div className="um-dialog-header">
          <h2 className="um-dialog-title">
            {dialogState.operation === "add" ? "Add New Role" : "Edit Role"}
          </h2>
          <button
            className="um-dialog-close-btn"
            onClick={onClose}
            disabled={isSavingRole}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>
        <div className="um-dialog-body">
          <div className="um-form-field">
            <label className="um-form-label" htmlFor="um-role-select">
              Role <span className="um-required">*</span>
            </label>
            <Select value={selectedRole} onValueChange={onSelectedRoleChange}>
              <SelectTrigger id="um-role-select" className="um-select-trigger">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="um-form-field">
            <label className="um-form-label" htmlFor="um-org-input">
              Organisation ID <span className="um-required">*</span>
            </label>
            <Input
              id="um-org-input"
              type="text"
              placeholder="Enter Organisation ID"
              value={organisationId}
              onChange={(e) => onOrganisationIdChange(e.target.value)}
              disabled={isSavingRole}
            />
          </div>
        </div>
        <div className="um-dialog-footer">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isSavingRole}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSavingRole} className="um-save-btn">
            {isSavingRole ? "Saving..." : dialogState.operation === "add" ? "Add" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};
