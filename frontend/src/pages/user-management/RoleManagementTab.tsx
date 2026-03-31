import React, { useState, useCallback } from "react";
import { FiSearch } from "react-icons/fi";
import PageLoader from "@/components/common/PageLoader";
// ConfirmDialog moved out
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { RoleDialog, type RoleDialogState } from "./RoleDialog";
import { DeleteRoleDialog, type DeleteDialogState } from "./DeleteRoleDialog";
import { UserRoleTable } from "./UserRoleTable";
import { useToast } from "@/hooks/useToast";
import { useTelemetry } from "@/hooks/useTelemetry";
import {
  userManagementService,
  type UserSearchResult,
  type RoleItem,
  type UserRoleInfo,
  type OrganisationOption,
} from "@/services/UserManagementService";
import "./user-management.css";

/* ── Types ──────────────────────────────────────────────────────────────── */
// RoleDialogState moved to RoleDialog.tsx

interface RoleManagementTabProps {
  availableRoles: RoleItem[];
  onRefreshSearch: () => void;
  userOrganisations: OrganisationOption[];
}

const RoleManagementTab = ({ availableRoles, onRefreshSearch, userOrganisations }: RoleManagementTabProps) => {
  const { toast } = useToast();
  const telemetry = useTelemetry();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [roleDialog, setRoleDialog] = useState<RoleDialogState>({
    open: false,
    userId: "",
    operation: "add",
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [organisationId, setOrganisationId] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    userId: "",
    roleInfo: null,
  });
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  const refreshResults = useCallback(async (query: string) => {
    if (!query.trim()) return;
    try {
      const response = await userManagementService.searchUser(query.trim());
      setSearchResults(response.data?.response?.content ?? []);
      onRefreshSearch();
    } catch {
      toast({ title: "Refresh failed", description: "Could not refresh user search results.", variant: "destructive" });
    }
  }, [onRefreshSearch, toast]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) {
      toast({ title: "Enter a username", description: "Please enter a username to search.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setHasSearched(false);
    try {
      const response = await userManagementService.searchUser(query);
      setSearchResults(response.data?.response?.content ?? []);
    } catch (err) {
      toast({ title: "Search failed", description: (err as Error).message || "Could not fetch user data.", variant: "destructive" });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const openAddRoleDialog = (userId: string) => {
    setSelectedRole("");
    setOrganisationId("");
    setRoleDialog({ open: true, userId, operation: "add" });
  };

  const closeRoleDialog = () => {
    if (isSavingRole) return;
    setRoleDialog((prev) => ({ ...prev, open: false }));
    setSelectedRole("");
    setOrganisationId("");
  };

  const handleSaveRole = async () => {
    if (!selectedRole) {
      toast({ title: "Select a role", description: "Please choose a role.", variant: "destructive" });
      return;
    }
    if (!organisationId.trim()) {
      toast({ title: "Enter Organisation ID", description: "Please enter an Organisation ID.", variant: "destructive" });
      return;
    }
    setIsSavingRole(true);
    try {
      await userManagementService.assignRole(roleDialog.userId, selectedRole, organisationId.trim(), roleDialog.operation);
      telemetry.audit({
        edata: { props: ['roles'], state: roleDialog.operation === 'add' ? 'RoleAdded' : 'RoleUpdated' },
        object: { id: roleDialog.userId, type: 'User' },
      });
      toast({
        title: roleDialog.operation === "add" ? "Role Added" : "Role Updated",
        description: `Role ${selectedRole} has been ${roleDialog.operation === "add" ? "added" : "updated"} successfully.`,
        variant: "success",
      });
      // Optimistic update — immediately reflect the new role in the table
      setSearchResults((prev) =>
        prev.map((user) => {
          const uid = user.userId || user.id;
          if (uid !== roleDialog.userId) return user;
          const newRole: UserRoleInfo = {
            role: selectedRole,
            scope: [{ organisationId: organisationId.trim() }],
            createdDate: new Date().toISOString(),
            updatedDate: null,
            userId: roleDialog.userId,
          };
          return { ...user, roles: [...(user.roles ?? []), newRole] };
        })
      );
      closeRoleDialog();
      refreshResults(searchQuery); // background sync — no await
    } catch (err) {
      toast({ title: "Operation failed", description: (err as Error).message || "Could not save role.", variant: "destructive" });
    } finally {
      setIsSavingRole(false);
    }
  };

  const openDeleteDialog = (userId: string, roleInfo: UserRoleInfo) => {
    setDeleteDialog({ open: true, userId, roleInfo });
  };

  const closeDeleteDialog = () => {
    if (isDeletingRole) return;
    setDeleteDialog({ open: false, userId: "", roleInfo: null });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.roleInfo) return;
    setIsDeletingRole(true);
    const removedRole = deleteDialog.roleInfo.role;
    const removedUserId = deleteDialog.userId;
    try {
      await userManagementService.assignRole(
        removedUserId,
        removedRole,
        deleteDialog.roleInfo.scope?.[0]?.organisationId ?? "",
        "remove"
      );
      telemetry.audit({
        edata: { props: ['roles'], state: 'RoleRemoved' },
        object: { id: removedUserId, type: 'User' },
      });
      toast({ title: "Role Removed", description: `Role ${removedRole} has been removed.`, variant: "destructive" });
      // Optimistic update — immediately remove the role chip from the table
      setSearchResults((prev) =>
        prev.map((user) => {
          const uid = user.userId || user.id;
          if (uid !== removedUserId) return user;
          return { ...user, roles: (user.roles ?? []).filter((r) => r.role !== removedRole) };
        })
      );
      closeDeleteDialog();
      refreshResults(searchQuery); // background sync — no await
    } catch (err) {
      toast({ title: "Delete failed", description: (err as Error).message || "Could not remove role.", variant: "destructive" });
    } finally {
      setIsDeletingRole(false);
    }
  };

  return (
    <>
      {/* Search Row */}
      <div className="um-tab-search-row mb-6">
        <div className="um-search-input-wrapper">
          <FiSearch className="um-search-icon" aria-hidden="true" />
          <Input
            id="um-search-input"
            type="text"
            className="um-search-input"
            placeholder="Search User by Sunbird ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <Button onClick={handleSearch} disabled={isSearching} className="um-search-btn" data-edataid="um-user-search" data-pageid="user-management">
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Results */}
      {isSearching && <PageLoader message="Searching users..." fullPage={false} />}

      {!isSearching && hasSearched && (
        <div className="um-results-card">
          <UserRoleTable
            searchResults={searchResults}
            searchQuery={searchQuery}
            onOpenDeleteDialog={openDeleteDialog}
            onOpenAddRoleDialog={openAddRoleDialog}
          />
        </div>
      )}

      {!isSearching && !hasSearched && (
        <div className="um-initial-state">
          <FiSearch className="um-initial-icon" aria-hidden="true" />
          <p className="um-initial-text">Enter a Sunbird ID above and click Search to find users</p>
        </div>
      )}

      {/* ── Add / Edit Role Dialog ── */}
      <RoleDialog
        dialogState={roleDialog}
        availableRoles={availableRoles}
        selectedRole={selectedRole}
        organisationId={organisationId}
        isSavingRole={isSavingRole}
        onClose={closeRoleDialog}
        onSave={handleSaveRole}
        onSelectedRoleChange={setSelectedRole}
        onOrganisationIdChange={setOrganisationId}
        userOrganisations={userOrganisations}
      />

      {/* ── Delete Confirmation ── */}
      <DeleteRoleDialog
        dialogState={deleteDialog}
        isDeletingRole={isDeletingRole}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default RoleManagementTab;
