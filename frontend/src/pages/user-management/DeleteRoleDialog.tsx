import React from "react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { UserRoleInfo } from "@/services/UserManagementService";

export interface DeleteDialogState {
  open: boolean;
  userId: string;
  roleInfo: UserRoleInfo | null;
}

interface DeleteRoleDialogProps {
  dialogState: DeleteDialogState;
  isDeletingRole: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteRoleDialog = ({
  dialogState,
  isDeletingRole,
  onClose,
  onConfirm,
}: DeleteRoleDialogProps) => {
  return (
    <ConfirmDialog
      open={dialogState.open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isDeletingRole}
      title="Remove Role"
      description={
        dialogState.roleInfo
          ? `Are you sure you want to remove the role "${dialogState.roleInfo.role}"? This action cannot be undone.`
          : "Are you sure you want to remove this role?"
      }
      confirmLabel="Remove"
      confirmVariant="destructive"
    />
  );
};
