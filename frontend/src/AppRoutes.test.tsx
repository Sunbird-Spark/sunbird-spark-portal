import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, beforeEach, it, expect, vi } from "vitest";
import AppRoutes from "./AppRoutes";

// --------------------
// Mock Pages
// --------------------
vi.mock("./pages/HomePage", () => ({ default: () => <div>Home Page</div> }));
vi.mock("./pages/UnauthorizedPage", () => ({ default: () => <div>Unauthorized Page</div> }));
vi.mock("./pages/AdminPage", () => ({ default: () => <div>Admin Page</div> }));
vi.mock("./pages/WorkspacePage", () => ({ default: () => <div>Workspace Page</div> }));
vi.mock("./pages/ReportsPage", () => ({ default: () => <div>Reports Page</div> }));
vi.mock("./pages/CreateContentPage", () => ({ default: () => <div>Create Content Page</div> }));

// --------------------
// Mock AuthContext
// --------------------
const mockUseAuth = vi.fn();

vi.mock("./auth/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => mockUseAuth(),
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

  it("public route: /unauthorized renders UnauthorizedPage", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "1", name: "A", role: "content_creator" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/unauthorized");
    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
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
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("catch-all: unknown route redirects to /home", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/random-route");
    expect(screen.getByText("Home Page")).toBeInTheDocument();
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
    mockUseAuth.mockReturnValue({
      user: { id: "2", name: "B", role: "content_creator" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/admin");
    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });

  it("protected: authenticated admin can access /admin", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "3", name: "C", role: "admin" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/admin");
    expect(screen.getByText("Admin Page")).toBeInTheDocument();
  });

  it("protected: content_creator can access /create", () => {
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

  it("protected: content_reviewer cannot access /create", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "5", name: "E", role: "content_reviewer" },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refetchUser: vi.fn(),
    });

    renderWithRoute("/create");
    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });
});
