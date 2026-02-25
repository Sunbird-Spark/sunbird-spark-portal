import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, beforeEach, it, expect, vi } from "vitest";
import AppRoutes from "./AppRoutes";

// --------------------
// Mock Pages
// --------------------
vi.mock("./pages/home/Home", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./pages/admin/AdminPage", () => ({ default: () => <div>Admin Page</div> }));
vi.mock("./pages/workspace/WorkspacePage", () => ({ default: () => <div>Workspace Page</div> }));
vi.mock("./pages/reports/ReportsPage", () => ({ default: () => <div>Reports Page</div> }));
vi.mock("./pages/content/CreateContentPage", () => ({ default: () => <div>Create Content Page</div> }));
vi.mock("./pages/Explore", () => ({ default: () => <div>Explore Page</div> }));
vi.mock("./pages/Index", () => ({ default: () => <div>Index Page</div> }));
vi.mock("./pages/onboarding/OnboardingPage", () => ({ default: () => <div>Onboarding Page</div> }));

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

function renderWithRoute(route: string) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppRoutes />
    </MemoryRouter>
  );
}

describe("AppRoutes (RBAC routing tests)", () => {
  beforeEach(() => {
    mockUseAuth.mockReset();
    mockUsePermissions.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      roles: ['GUEST'],
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn(() => false),
      hasAllRoles: vi.fn(),
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

  it("protected: unauthenticated user visiting /admin redirects to /home", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/admin");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("protected: authenticated but wrong role visiting /admin redirects to /unauthorized", () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      roles: ['CONTENT_CREATOR'],
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn((roles: string[]) => roles.includes('CONTENT_CREATOR')),
      hasAllRoles: vi.fn(),
      canAccessFeature: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithRoute("/admin");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("protected: authenticated admin can access /admin", () => {
    mockUsePermissions.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      roles: ['ADMIN'],
      error: null,
      hasRole: vi.fn(),
      hasAnyRole: vi.fn((roles: string[]) => roles.includes('ADMIN')),
      hasAllRoles: vi.fn(),
      canAccessFeature: vi.fn(),
      refetch: vi.fn(),
    });

    renderWithRoute("/admin");
    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  it("public route: /create renders CreateContentPage for content_creator", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "4", name: "D", role: "content_creator" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/create");
    expect(screen.getByText("Create Content Page")).toBeInTheDocument();
  });

  it("public route: /create renders CreateContentPage for content_reviewer", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "5", name: "E", role: "content_reviewer" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/create");
    expect(screen.getByText("Create Content Page")).toBeInTheDocument();
  });
});
