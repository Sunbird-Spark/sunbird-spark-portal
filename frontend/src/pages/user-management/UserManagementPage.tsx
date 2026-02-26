import React, { useState, useEffect, useCallback } from "react";
import { FiShield, FiLoader } from "react-icons/fi";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/home/Sheet";
import Header from "@/components/home/Header";
import HomeSidebar from "@/components/home/HomeSidebar";
import Footer from "@/components/home/Footer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/useToast";
import { useSidebarState } from "@/hooks/useSidebarState";
import {
  userManagementService,
  type RoleItem,
} from "@/services/UserManagementService";
import RoleManagementTab from "./RoleManagementTab";
import { TncCheckboxRow } from "@/components/collection/TncCheckboxRow";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useAcceptTnc } from "@/hooks/useTnc";
import { cn } from "@/lib/utils";
import "../home/home.css";
import "./user-management.css";

/* ── Types ──────────────────────────────────────────────────────────────── */

type UMTab = {
  id: string;
  label: string;
  icon: React.ElementType;
};

const UM_TABS: UMTab[] = [
  { id: "role-management", label: "Change User Roles", icon: FiShield },
];

/* ── Main Page ───────────────────────────────────────────────────────────── */

const UserManagementPage = () => {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [activeNav, setActiveNav] = useState("user-management");
  const { isOpen: isSidebarOpen, setSidebarOpen: setIsSidebarOpen } = useSidebarState(!isMobile);

  const [activeTab, setActiveTab] = useState<string>(UM_TABS[0]?.id ?? "role-management");
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);
  const [tncChecked, setTncChecked] = useState(false);
  const [orgTncAccepted, setOrgTncAccepted] = useState(false);

  const { data: orgAdminTncConfig, isSuccess: isOrgTncSuccess } = useSystemSetting('orgAdminTnc');
  const acceptTncMutation = useAcceptTnc();

  const loadRoles = useCallback(async () => {
    try {
      const response = await userManagementService.getRoles();
      const roles: RoleItem[] = response.data?.roles ?? [];
      setAvailableRoles(roles.filter((r) => r.id !== 'PUBLIC'));
    } catch (err) {
      toast({ title: "Failed to load roles", description: "Roles could not be loaded.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleAcceptOrgTnc = async () => {
    if (!tncChecked || !isOrgTncSuccess || !orgAdminTncConfig) return;
    try {
      await acceptTncMutation.mutateAsync({
        tncConfig: orgAdminTncConfig,
        tncType: 'orgAdminTnc',
      });
      setOrgTncAccepted(true);
      toast({ title: "Terms accepted", description: "You can now use User Management features." });
    } catch {
      toast({ title: "Failed to accept Terms", description: "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="workspace-container">
      <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={() => setIsSidebarOpen(true)} />

      <div className="flex flex-1 relative transition-all">
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

                {/* ── Org Admin TnC acceptance (shown until accepted) ── */}
                {!orgTncAccepted && (
                  <div className="mt-3 rounded-lg bg-gray-50 border border-border p-4 space-y-3">
                    <TncCheckboxRow
                      checked={tncChecked}
                      onCheckedChange={(v) => setTncChecked(!!v)}
                      settingKey="orgAdminTnc"
                      label="to use User Management features."
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled={!tncChecked || acceptTncMutation.isPending}
                        onClick={handleAcceptOrgTnc}
                        className={cn(
                          "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white font-['Rubik'] transition-colors",
                          !tncChecked || acceptTncMutation.isPending
                            ? "bg-sunbird-brick/40 cursor-not-allowed"
                            : "bg-sunbird-brick hover:bg-opacity-90"
                        )}
                      >
                        {acceptTncMutation.isPending && <FiLoader className="w-4 h-4 animate-spin" />}
                        {acceptTncMutation.isPending ? "Accepting…" : "Accept & Continue"}
                      </button>
                    </div>
                  </div>
                )}
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
