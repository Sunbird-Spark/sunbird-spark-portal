import React, { useState, useEffect, useCallback } from "react";
import { FiShield } from "react-icons/fi";
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
  type OrganisationOption,
} from "@/services/UserManagementService";
import RoleManagementTab from "./RoleManagementTab";
import { TermsAndConditionsDialog } from "@/components/common/TermsAndConditionsDialog";
import { useSystemSetting } from "@/hooks/useSystemSetting";
import { useAcceptTnc, useGetTncUrl } from "@/hooks/useTnc";
import { useUserRead } from "@/hooks/useUserRead";
import { TncService } from "@/services/TncService";
import _ from "lodash";
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
  const [tncDialogOpen, setTncDialogOpen] = useState(false);

  /* ── Fetch orgAdminTnc; fall back to tncConfig if no URL is found ── */
  const { data: orgAdminTncConfig, isSuccess: isOrgTncSuccess } = useSystemSetting('orgAdminTnc');
  const { data: fallbackTncConfig, isSuccess: isFallbackSuccess } = useSystemSetting('tncConfig');

  const { data: orgAdminTncUrl } = useGetTncUrl(isOrgTncSuccess ? orgAdminTncConfig : null);
  const { data: fallbackTncUrl } = useGetTncUrl(isFallbackSuccess ? fallbackTncConfig : null);

  const termsUrl = orgAdminTncUrl || fallbackTncUrl || '';
  const activeTncConfig = orgAdminTncUrl ? orgAdminTncConfig : fallbackTncConfig;
  const activeTncType = orgAdminTncUrl ? 'orgAdminTnc' : 'tncConfig';

  const acceptTncMutation = useAcceptTnc();
  const { data: userRes, refetch: refetchUser } = useUserRead();

  const shouldShowTnc = (() => {
    if (!termsUrl || !activeTncConfig || !userRes) return false;
    const tncService = new TncService();
    const latestVersion = tncService.getLatestVersion(activeTncConfig);
    const acceptedVersion = _.get(userRes?.data, ['response', 'allTncAccepted', activeTncType, 'version']);
    return latestVersion !== acceptedVersion;
  })();

  const userOrganisations = React.useMemo((): OrganisationOption[] => {
    const orgs: OrganisationOption[] = [];
    const responseData: any = _.get(userRes, 'data.response', {});
    
    // 1. Check rootOrg object
    if (responseData.rootOrg) {
      orgs.push({
        organisationId: responseData.rootOrg.id || responseData.rootOrg.rootOrgId || responseData.rootOrgId,
        orgName: responseData.rootOrg.orgName || responseData.rootOrgName
      });
    } 
    // 2. Fallback to top-level rootOrgId/rootOrgName if rootOrg object is missing/incomplete
    else if (responseData.rootOrgId) {
      orgs.push({
        organisationId: responseData.rootOrgId,
        orgName: responseData.rootOrgName || 'Root Organisation'
      });
    }

    // 3. Add other organisations if any
    if (Array.isArray(responseData.organisations)) {
      responseData.organisations.forEach((org: any) => {
        const orgId = org.organisationId || org.id;
        const orgName = org.orgName || org.orgName;
        if (orgId && !orgs.find(o => o.organisationId === orgId)) {
          orgs.push({
            organisationId: orgId,
            orgName: orgName || 'Unknown Organisation'
          });
        }
      });
    }
    
    return orgs;
  }, [userRes]);

  const loadRoles = useCallback(async () => {
    try {
      const response = await userManagementService.getRoles();
      // Service might return { data: { result: { response: { roleList } } } } 
      // or { data: { result: { roles } } } or { data: { roles } }
      const roles: RoleItem[] = 
        response.data?.result?.response?.roleList ?? 
        response.data?.result?.roles ?? 
        response.data?.roles ?? 
        [];
      setAvailableRoles(roles.filter((r) => r.id !== 'PUBLIC'));
    } catch (err) {
      toast({ title: "Failed to load roles", description: "Roles could not be loaded.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  const handleAcceptOrgTnc = async () => {
    if (!activeTncConfig) return;
    try {
      await acceptTncMutation.mutateAsync({ tncConfig: activeTncConfig, tncType: activeTncType });
      setTncDialogOpen(false);
      refetchUser();
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
                <p className="text-xs text-sunbird-gray-75 mt-1 font-['Rubik']">
                  By using User Management features, you acknowledge and accept the{" "}
                  {termsUrl ? (
                    <TermsAndConditionsDialog
                      termsUrl={termsUrl}
                      title="Terms &amp; Conditions"
                      open={tncDialogOpen}
                      onOpenChange={setTncDialogOpen}
                      onAccept={shouldShowTnc ? handleAcceptOrgTnc : undefined}
                      accepting={acceptTncMutation.isPending}
                    >
                      <button
                        type="button"
                        className="underline text-sunbird-brick hover:opacity-80 font-medium"
                      >
                        Terms &amp; Conditions
                      </button>
                    </TermsAndConditionsDialog>
                  ) : (
                    <span className="font-medium text-sunbird-obsidian">Terms &amp; Conditions</span>
                  )}
                  .
                </p>
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
                    <RoleManagementTab
                      availableRoles={availableRoles}
                      onRefreshSearch={loadRoles}
                      userOrganisations={userOrganisations}
                    />
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
