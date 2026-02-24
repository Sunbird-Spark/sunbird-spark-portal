import { useState, useEffect, useCallback } from "react";
import { FiSearch, FiPlus, FiEdit2, FiTrash2, FiX, FiShield } from "react-icons/fi";
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

/* ── Types ──────────────────────────────────────────────────────────────── */

type UMTab = {
  id: string;
  label: string;
  icon: React.ElementType;
};

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

/* ── Sidebar tabs config ─────────────────────────────────────────────────── */
const UM_TABS: UMTab[] = [
  { id: "role-management", label: "Change User Roles", icon: FiShield },
  // Add more tabs here as needed
];

/* ── Tab: Role Management ────────────────────────────────────────────────── */
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

  // openEditRoleDialog removed as per user request to disable Edit


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
                                {/* Edit button removed as per user request */}
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
      {roleDialog.open && (
        <div className="um-dialog-overlay" onClick={closeRoleDialog} role="dialog" aria-modal="true" aria-label={roleDialog.operation === "add" ? "Add New Role" : "Edit Role"}>
          <div className="um-dialog-panel" onClick={(e) => e.stopPropagation()}>
            <div className="um-dialog-header">
              <h2 className="um-dialog-title">{roleDialog.operation === "add" ? "Add New Role" : "Edit Role"}</h2>
              <button className="um-dialog-close-btn" onClick={closeRoleDialog} disabled={isSavingRole} aria-label="Close">
                <FiX size={18} />
              </button>
            </div>
            <div className="um-dialog-body">
              <div className="um-form-field">
                <label className="um-form-label" htmlFor="um-role-select">Role <span className="um-required">*</span></label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="um-role-select" className="um-select-trigger">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="um-form-field">
                <label className="um-form-label" htmlFor="um-org-input">Organisation ID <span className="um-required">*</span></label>
                <Input id="um-org-input" type="text" placeholder="Enter Organisation ID" value={organisationId} onChange={(e) => setOrganisationId(e.target.value)} disabled={isSavingRole} />
              </div>
            </div>
            <div className="um-dialog-footer">
              <Button variant="ghost" size="sm" onClick={closeRoleDialog} disabled={isSavingRole}>Cancel</Button>
              <Button size="sm" onClick={handleSaveRole} disabled={isSavingRole} className="um-save-btn">
                {isSavingRole ? "Saving..." : roleDialog.operation === "add" ? "Add" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
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
    </>
  );
};

/* ── Main Page ───────────────────────────────────────────────────────────── */

const UserManagementPage = () => {
  const isMobile = useIsMobile();
  const [activeNav, setActiveNav] = useState("user-management");
  const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen } = useSidebarState(!isMobile);

  const [activeTab, setActiveTab] = useState<string>(UM_TABS[0]?.id ?? "role-management");
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);

  const loadRoles = useCallback(async () => {
    try {
      const response = await userManagementService.getRoles();
      setAvailableRoles(response.data?.result?.roles ?? []);
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  return (
    <div className="workspace-container">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 relative transition-all">
        {/* App navigation sidebar (Home / Workspace / etc.) */}
        {isMobile ? (
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="w-[17.5rem] pt-10 px-0 pb-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <HomeSidebar activeNav={activeNav} onNavChange={(nav) => { setActiveNav(nav); setIsSidebarOpen(false); }} />
            </SheetContent>
          </Sheet>
        ) : (
          <div className="relative shrink-0 sticky top-[4.5rem] self-start z-20">
            <HomeSidebar activeNav={activeNav} onNavChange={setActiveNav} collapsed={!isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
          </div>
        )}

        {/* Page content */}
        <div className="flex-1 flex flex-col min-w-0">
          <main className="workspace-main-content">
            <div className="workspace-content-wrapper">

              {/* ── Page header ── */}
              <div className="um-page-header">
                <h1 className="um-page-title">User Management</h1>
              </div>

              {/* ── Top Tabs layout ── */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-border min-h-[32rem]">

                {/* Top Tabs */}
                <div className="border-b border-border bg-gray-50/50 px-4 pt-4">
                  <nav className="flex gap-6">
                    {UM_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 pb-3 px-1 border-b-2 text-[0.9375rem] font-medium transition-colors ${
                            isActive
                              ? "border-sunbird-brick text-sunbird-brick"
                              : "border-transparent text-sunbird-gray-75 hover:text-sunbird-obsidian hover:border-gray-300"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Content area */}
                <div className="p-6">
                  {activeTab === "role-management" && (
                    <RoleManagementTab availableRoles={availableRoles} onRefreshSearch={loadRoles} />
                  )}
                </div>

              </div>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
