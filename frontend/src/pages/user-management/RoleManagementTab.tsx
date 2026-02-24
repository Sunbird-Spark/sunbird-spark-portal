import React, { useState, useCallback } from "react";
import { FiSearch, FiPlus, FiTrash2 } from "react-icons/fi";
import PageLoader from "@/components/common/PageLoader";
// ConfirmDialog moved out
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { RoleDialog, type RoleDialogState } from "./RoleDialog";
import { DeleteRoleDialog, type DeleteDialogState } from "./DeleteRoleDialog";
import { useToast } from "@/hooks/useToast";
import {
  userManagementService,
  type UserSearchResult,
  type RoleItem,
  type UserRoleInfo,
} from "@/services/UserManagementService";
import "./user-management.css";

/* ── Types ──────────────────────────────────────────────────────────────── */
// RoleDialogState moved to RoleDialog.tsx

// DeleteDialogState moved to DeleteRoleDialog.tsx

interface RoleManagementTabProps {
  availableRoles: RoleItem[];
  onRefreshSearch: () => void;
}

const RoleManagementTab = ({ availableRoles, onRefreshSearch }: RoleManagementTabProps) => {
  const { toast } = useToast();
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
    const response = await userManagementService.searchUser(query.trim());
    setSearchResults(response.data?.response?.content ?? []);
    onRefreshSearch();
  }, [onRefreshSearch]);

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
      toast({
        title: roleDialog.operation === "add" ? "Role Added" : "Role Updated",
        description: `Role ${selectedRole} has been ${roleDialog.operation === "add" ? "added" : "updated"} successfully.`,
      });
      closeRoleDialog();
      await refreshResults(searchQuery);
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
    try {
      await userManagementService.assignRole(
        deleteDialog.userId,
        deleteDialog.roleInfo.role,
        deleteDialog.roleInfo.scope?.[0]?.organisationId ?? "",
        "remove"
      );
      toast({ title: "Role Removed", description: `Role ${deleteDialog.roleInfo.role} has been removed.`, variant: "destructive" });
      closeDeleteDialog();
      await refreshResults(searchQuery);
    } catch (err) {
      toast({ title: "Delete failed", description: (err as Error).message || "Could not remove role.", variant: "destructive" });
    } finally {
      setIsDeletingRole(false);
    }
  };

  const getStatusLabel = (status: number) => (status === 1 ? "Active" : "Inactive");
  const getUserDisplayName = (user: UserSearchResult) =>
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.userName;

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
        <Button onClick={handleSearch} disabled={isSearching} className="um-search-btn">
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>

      {/* Results */}
      {isSearching && <PageLoader message="Searching users..." fullPage={false} />}

      {!isSearching && hasSearched && (
        <div className="um-results-card">
          {searchResults.length === 0 ? (
            <div className="um-empty-state">
              <p className="um-empty-text">No users found for "<strong>{searchQuery}</strong>"</p>
            </div>
          ) : (
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
                  {searchResults.map((user, idx) => (
                    <tr key={user.userId} className="um-table-row">
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
                                <button className="um-role-action-btn um-role-delete-btn" title="Remove role" onClick={() => openDeleteDialog(user.userId, roleInfo)} aria-label={`Remove role ${roleInfo.role}`}>
                                  <FiTrash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="um-no-roles">No roles assigned</span>
                        )}
                      </td>
                      <td className="um-td um-td-actions">
                        <Button size="sm" onClick={() => openAddRoleDialog(user.userId)} className="um-add-role-btn" title="Add a new role">
                          <FiPlus size={14} />
                          <span>Add Role</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
      />

      {/* ── Delete Confirmation ── */}
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
