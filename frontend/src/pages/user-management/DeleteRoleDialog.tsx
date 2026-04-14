import React from "react";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { UserRoleInfo } from "@/services/UserManagementService";
import { useAppI18n } from "@/hooks/useAppI18n";

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
  const { t } = useAppI18n();

  return (
    <ConfirmDialog
      open={dialogState.open}
      onClose={onClose}
      onConfirm={onConfirm}
      isLoading={isDeletingRole}
      title={t("userManagement.deleteRoleDialog.title")}
      description={
        dialogState.roleInfo
          ? t("userManagement.deleteRoleDialog.confirmDesc", { role: dialogState.roleInfo.role })
          : t("userManagement.deleteRoleDialog.confirmDescFallback")
      }
      confirmLabel={t("userManagement.deleteRoleDialog.remove")}
      confirmVariant="destructive"
    />
  );
};
