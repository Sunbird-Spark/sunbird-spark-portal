import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX } from "react-icons/fi";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/home/Sheet";
import Header from "@/components/home/Header";
import HomeSidebar from "@/components/home/HomeSidebar";
import Footer from "@/components/home/Footer";
import PageLoader from "@/components/common/PageLoader";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/common/Select";
import { useToast } from "@/hooks/useToast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarState } from "@/hooks/useSidebarState";
import {
  userManagementService,
  type UserSearchResult,
  type RoleItem,
  type UserRoleInfo,
} from "@/services/UserManagementService";
import "../home/home.css";
import "./user-management.css";

interface RoleDialogState {
  open: boolean;
  userId: string;
  operation: "add" | "update";
  currentRole?: UserRoleInfo;
}

interface DeleteDialogState {
  open: boolean;
  userId: string;
  roleInfo: UserRoleInfo | null;
}

const UserManagementPage = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState("user-management");
  const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen } =
    useSidebarState(!isMobile);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Roles list from API
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);

  // Role dialog state
  const [roleDialog, setRoleDialog] = useState<RoleDialogState>({
    open: false,
    userId: "",
    operation: "add",
  });
  const [selectedRole, setSelectedRole] = useState("");
  const [organisationId, setOrganisationId] = useState("");
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    userId: "",
    roleInfo: null,
  });
  const [isDeletingRole, setIsDeletingRole] = useState(false);

  // Load available roles on mount
  const loadRoles = useCallback(async () => {
    try {
      const response = await userManagementService.getRoles();
      const roles: RoleItem[] = response.data?.roles ?? [];
      setAvailableRoles(roles);
    } catch {
      // Roles will be empty; non-blocking
    }
  }, []);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

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
      const content: UserSearchResult[] = response.data?.response?.content ?? [];
      setSearchResults(content);
    } catch (err) {
      toast({
        title: "Search failed",
        description: (err as Error).message || "Could not fetch user data.",
        variant: "destructive",
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
      setHasSearched(true);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // ── Add Role ──────────────────────────────────────────────────────────────
  const openAddRoleDialog = (userId: string) => {
    setSelectedRole("");
    setOrganisationId("");
    setRoleDialog({ open: true, userId, operation: "add" });
  };

  // ── Edit Role ─────────────────────────────────────────────────────────────
  const openEditRoleDialog = (userId: string, roleInfo: UserRoleInfo) => {
    setSelectedRole(roleInfo.role);
    setOrganisationId(roleInfo.scope?.[0]?.organisationId ?? "");
    setRoleDialog({ open: true, userId, operation: "update", currentRole: roleInfo });
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
      await userManagementService.assignRole(
        roleDialog.userId,
        selectedRole,
        organisationId.trim(),
        roleDialog.operation
      );
      toast({
        title: roleDialog.operation === "add" ? "Role Added" : "Role Updated",
        description: `Role ${selectedRole} has been ${roleDialog.operation === "add" ? "added" : "updated"} successfully.`,
      });
      closeRoleDialog();
      // Re-run search to reflect changes
      if (searchQuery.trim()) {
        const response = await userManagementService.searchUser(searchQuery.trim());
        setSearchResults(response.data?.response?.content ?? []);
      }
    } catch (err) {
      toast({
        title: "Operation failed",
        description: (err as Error).message || "Could not save role.",
        variant: "destructive",
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  // ── Delete Role ───────────────────────────────────────────────────────────
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
      toast({
        title: "Role Removed",
        description: `Role ${deleteDialog.roleInfo.role} has been removed.`,
        variant: "destructive",
      });
      closeDeleteDialog();
      // Re-run search to reflect changes
      if (searchQuery.trim()) {
        const response = await userManagementService.searchUser(searchQuery.trim());
        setSearchResults(response.data?.response?.content ?? []);
      }
    } catch (err) {
      toast({
        title: "Delete failed",
        description: (err as Error).message || "Could not remove role.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingRole(false);
    }
  };

  const getStatusLabel = (status: number) =>
    status === 1 ? "Active" : "Inactive";

  const getUserDisplayName = (user: UserSearchResult) =>
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.userName;

  return (
    <div className="workspace-container">
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(true)}
      />

      <div className="flex flex-1 relative transition-all">
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <HomeSidebar
                activeNav={activeNav}
                onNavChange={(nav) => {
                  setActiveNav(nav);
                  setIsSidebarOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
            <HomeSidebar
              activeNav={activeNav}
              onNavChange={setActiveNav}
              collapsed={!isSidebarOpen}
              onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <main className="workspace-main-content">
            <div className="workspace-content-wrapper">
              {/* Page Title */}
              <div className="um-page-header">
                <h1 className="um-page-title">User Management</h1>
                <p className="um-page-subtitle">Search and manage user roles in your organisation</p>
              </div>

              {/* Search Bar */}
              <div className="um-search-card">
                <label className="um-search-label" htmlFor="um-search-input">
                  Search User by Username
                </label>
                <div className="um-search-row">
                  <div className="um-search-input-wrapper">
                    <FiSearch className="um-search-icon" aria-hidden="true" />
                    <Input
                      id="um-search-input"
                      type="text"
                      className="um-search-input"
                      placeholder="Enter username (e.g. user1)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                    />
                  </div>
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="um-search-btn"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>

              {/* Results */}
              {isSearching && (
                <PageLoader message="Searching users..." fullPage={false} />
              )}

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
                              <td className="um-td um-td-name">
                                {getUserDisplayName(user)}
                              </td>
                              <td className="um-td um-td-email">
                                {user.maskedEmail || user.email || "—"}
                              </td>
                              <td className="um-td">
                                <a
                                  href={`/profile/${user.userId}`}
                                  className="um-user-link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {user.userName}
                                </a>
                              </td>
                              <td className="um-td um-td-narrow">
                                <span
                                  className={`um-status-badge ${
                                    user.status === 1
                                      ? "um-status-active"
                                      : "um-status-inactive"
                                  }`}
                                >
                                  {getStatusLabel(user.status)}
                                </span>
                              </td>
                              <td className="um-td">
                                {user.roles && user.roles.length > 0 ? (
                                  <div className="um-roles-list">
                                    {user.roles.map((roleInfo) => (
                                      <div
                                        key={`${roleInfo.role}-${roleInfo.scope?.[0]?.organisationId}`}
                                        className="um-role-chip"
                                      >
                                        <span className="um-role-label">
                                          {roleInfo.role}
                                        </span>
                                        <button
                                          className="um-role-action-btn um-role-edit-btn"
                                          title="Edit role"
                                          onClick={() =>
                                            openEditRoleDialog(user.userId, roleInfo)
                                          }
                                          aria-label={`Edit role ${roleInfo.role}`}
                                        >
                                          <FiEdit2 size={12} />
                                        </button>
                                        <button
                                          className="um-role-action-btn um-role-delete-btn"
                                          title="Remove role"
                                          onClick={() =>
                                            openDeleteDialog(user.userId, roleInfo)
                                          }
                                          aria-label={`Remove role ${roleInfo.role}`}
                                        >
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
                                <Button
                                  size="sm"
                                  onClick={() => openAddRoleDialog(user.userId)}
                                  className="um-add-role-btn"
                                  title="Add a new role"
                                >
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

              {/* Prompt before first search */}
              {!isSearching && !hasSearched && (
                <div className="um-initial-state">
                  <FiSearch className="um-initial-icon" aria-hidden="true" />
                  <p className="um-initial-text">Enter a username above and click Search to find users</p>
                </div>
              )}
            </div>
          </main>
          <Footer />
        </div>
      </div>

      {/* ── Add / Edit Role Dialog ── */}
      {roleDialog.open && (
        <div
          className="um-dialog-overlay"
          onClick={closeRoleDialog}
          role="dialog"
          aria-modal="true"
          aria-label={roleDialog.operation === "add" ? "Add New Role" : "Edit Role"}
        >
          <div
            className="um-dialog-panel"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="um-dialog-header">
              <h2 className="um-dialog-title">
                {roleDialog.operation === "add" ? "Add New Role" : "Edit Role"}
              </h2>
              <button
                className="um-dialog-close-btn"
                onClick={closeRoleDialog}
                disabled={isSavingRole}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="um-dialog-body">
              {/* Role Field */}
              <div className="um-form-field">
                <label className="um-form-label" htmlFor="um-role-select">
                  Role <span className="um-required">*</span>
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger
                    id="um-role-select"
                    className="um-select-trigger"
                  >
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

              {/* Organisation ID Field */}
              <div className="um-form-field">
                <label className="um-form-label" htmlFor="um-org-input">
                  Organisation ID <span className="um-required">*</span>
                </label>
                <Input
                  id="um-org-input"
                  type="text"
                  placeholder="Enter Organisation ID"
                  value={organisationId}
                  onChange={(e) => setOrganisationId(e.target.value)}
                  disabled={isSavingRole}
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="um-dialog-footer">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeRoleDialog}
                disabled={isSavingRole}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveRole}
                disabled={isSavingRole}
                className="um-save-btn"
              >
                {isSavingRole
                  ? "Saving..."
                  : roleDialog.operation === "add"
                  ? "Add"
                  : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Role Confirmation ── */}
      <ConfirmDialog
        open={deleteDialog.open}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
        isLoading={isDeletingRole}
        title="Remove Role"
        description={
          deleteDialog.roleInfo
            ? `Are you sure you want to remove the role "${deleteDialog.roleInfo.role}"? This action cannot be undone.`
            : "Are you sure you want to remove this role?"
        }
        confirmLabel="Remove"
        confirmVariant="destructive"
      />
    </div>
  );
};

export default UserManagementPage;
