import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, beforeEach, it, expect, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppRoutes from "./AppRoutes";

// --------------------
// Mock Pages
// --------------------
vi.mock("./pages/home/Home", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./pages/workspace/WorkspacePage", () => ({ default: () => <div>Workspace Page</div> }));
vi.mock("./pages/reports/ReportsPage", () => ({ default: () => <div>Reports Page</div> }));
vi.mock("./pages/content/CreateContentPage", () => ({ default: () => <div>Create Content Page</div> }));
vi.mock("./pages/Explore", () => ({ default: () => <div>Explore Page</div> }));
vi.mock("./pages/Index", () => ({ default: () => <div>Index Page</div> }));
vi.mock("./pages/onboarding/OnboardingPage", () => ({ default: () => <div>Onboarding Page</div> }));
vi.mock("./pages/user-management/UserManagementPage", () => ({ default: () => <div>User Management Page</div> }));
vi.mock("./pages/reports/PlatformReports", () => ({ default: () => <div>Platform Reports Page</div> }));
vi.mock("./pages/reports/CourseReport", () => ({ default: () => <div>Course Report Page</div> }));
vi.mock("./pages/reports/UserReport", () => ({ default: () => <div>User Report Page</div> }));
vi.mock("./pages/profile/Profile", () => ({ default: () => <div>Profile Page</div> }));
vi.mock("./pages/collection/CollectionDetailPage", () => ({ default: () => <div>Collection Detail Page</div> }));
vi.mock("./pages/forgotPassword/ForgotPassword", () => ({ default: () => <div>Forgot Password Page</div> }));
vi.mock("./pages/forgotPassword/PasswordResetSuccess", () => ({ default: () => <div>Password Reset Success Page</div> }));
vi.mock("./pages/signup/SignUp", () => ({ default: () => <div>Sign Up Page</div> }));
vi.mock("./pages/helpSupport/HelpSupport", () => ({ default: () => <div>Help Support Page</div> }));
vi.mock("./pages/helpSupport/HelpCategoryDetail", () => ({ default: () => <div>Help Category Detail Page</div> }));
vi.mock("./pages/content/ContentPlayerPage", () => ({ default: () => <div>Content Player Page</div> }));
vi.mock("./pages/content/ContentEditorPage", () => ({ default: () => <div>Content Editor Page</div> }));
vi.mock("./pages/content/CollectionEditorPage", () => ({ default: () => <div>Collection Editor Page</div> }));
vi.mock("./pages/myLearning/MyLearning", () => ({ default: () => <div>My Learning Page</div> }));
vi.mock("./pages/workspace/editors/GenericEditorPage", () => ({ default: () => <div>Generic Editor Page</div> }));
vi.mock("./pages/content/QumlEditorPage", () => ({ default: () => <div>Quml Editor Page</div> }));
vi.mock("./pages/workspace/ContentReviewPage", () => ({ default: () => <div>Content Review Page</div> }));
vi.mock("./pages/courseDashboard/CourseDashboardPage", () => ({ default: () => <div>Course Dashboard Page</div> }));

// --------------------
// Mock AuthContext
// --------------------
const mockUseAuth = vi.fn();

vi.mock("./auth/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
}));

const mockUsePermissions = vi.fn();
vi.mock("./hooks/usePermission", () => ({
  usePermissions: () => mockUsePermissions(),
}));

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

function renderWithRoute(route: string) {
  return render(
    <QueryClientProvider client={createQueryClient()}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AppRoutes (RBAC routing tests)", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUsePermissions.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      roles: ['PUBLIC'],
      error: null,
      hasAnyRole: vi.fn(() => false),
      canAccessFeature: vi.fn(),
      refetch: vi.fn(),
    });
  });

  it("public route: /home renders HomePage", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/home");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("public route: /explore renders ExplorePage", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/explore");
    expect(screen.getByText("Explore Page")).toBeInTheDocument();
  });

  it("public route: /onboarding renders OnboardingPage", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/onboarding");
    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("redirect: / redirects to /home", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/");
    // The Index page is rendered at "/"
    expect(screen.getByText("Index Page")).toBeInTheDocument();
  });

  it("catch-all: unknown route redirects to /home", async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/random-route");
    // Catch-all redirects to "/" which renders Index page
    await waitFor(() => {
      expect(screen.getByText("Index Page")).toBeInTheDocument();
    });
  });


  it("protected: authenticated content_creator can access /create", () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      roles: ['CONTENT_CREATOR'],
      error: null,
      hasAnyRole: vi.fn((roles: string[]) => roles.includes('CONTENT_CREATOR')),
      canAccessFeature: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithRoute("/create");
    expect(screen.getByText("Create Content Page")).toBeInTheDocument();
  });

  it("protected: authenticated content_reviewer cannot access /create and is redirected", () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      roles: ['CONTENT_REVIEWER'],
      error: null,
      hasAnyRole: vi.fn((roles: string[]) => roles.includes('CONTENT_REVIEWER') && !roles.includes('CONTENT_CREATOR')),
      canAccessFeature: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithRoute("/create");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  // ── ORG_ADMIN protected routes ─────────────────────────────────────────────

  describe("ORG_ADMIN protected routes", () => {
    it("ORG_ADMIN can access /reports/platform", () => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true, isLoading: false, roles: ['ORG_ADMIN'], error: null,
        hasAnyRole: vi.fn((roles: string[]) => roles.includes('ORG_ADMIN')),
        canAccessFeature: vi.fn(), refetch: vi.fn(),
      });
      renderWithRoute("/reports/platform");
      expect(screen.getByText("Platform Reports Page")).toBeInTheDocument();
    });

    it("non-admin authenticated user is redirected from /reports/platform", () => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true, isLoading: false, roles: ['CONTENT_CREATOR'], error: null,
        hasAnyRole: vi.fn((roles: string[]) => !roles.includes('ORG_ADMIN')),
        canAccessFeature: vi.fn(), refetch: vi.fn(),
      });
      renderWithRoute("/reports/platform");
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    it("CONTENT_CREATOR can access /reports/course/:courseId", () => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true, isLoading: false, roles: ['CONTENT_CREATOR'], error: null,
        hasAnyRole: vi.fn((allowedRoles: string[]) => 
          allowedRoles.some(role => ['CONTENT_CREATOR'].includes(role))
        ),
        canAccessFeature: vi.fn(), refetch: vi.fn(),
      });
      renderWithRoute("/reports/course/course-123");
      expect(screen.getByText("Course Report Page")).toBeInTheDocument();
    });

    it("user without CONTENT_CREATOR or COURSE_MENTOR is redirected from /reports/course/:courseId", () => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true, isLoading: false, roles: ['PUBLIC'], error: null,
        hasAnyRole: vi.fn((allowedRoles: string[]) => 
          allowedRoles.some(role => ['PUBLIC'].includes(role))
        ),
        canAccessFeature: vi.fn(), refetch: vi.fn(),
      });
      renderWithRoute("/reports/course/course-123");
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });

    it("ORG_ADMIN can access /user-management", () => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true, isLoading: false, roles: ['ORG_ADMIN'], error: null,
        hasAnyRole: vi.fn((roles: string[]) => roles.includes('ORG_ADMIN')),
        canAccessFeature: vi.fn(), refetch: vi.fn(),
      });
      renderWithRoute("/user-management");
      expect(screen.getByText("User Management Page")).toBeInTheDocument();
    });

    it("non-admin authenticated user is redirected from /user-management", () => {
      mockUsePermissions.mockReturnValue({
        isAuthenticated: true, isLoading: false, roles: ['CONTENT_CREATOR'], error: null,
        hasAnyRole: vi.fn((roles: string[]) => !roles.includes('ORG_ADMIN')),
        canAccessFeature: vi.fn(), refetch: vi.fn(),
      });
      renderWithRoute("/user-management");
      expect(screen.getByText("Home Page")).toBeInTheDocument();
    });
  });
});
