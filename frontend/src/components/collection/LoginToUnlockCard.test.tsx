import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginToUnlockCard from "./LoginToUnlockCard";

vi.mock("@/hooks/useAppI18n", () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

const renderComponent = (initialPath = "/collection/do_123") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LoginToUnlockCard />
    </MemoryRouter>
  );

describe("LoginToUnlockCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: "" };
  });

  it("renders with title and description from translations", () => {
    renderComponent();
    expect(screen.getByText("courseDetails.unlockLearningTitle")).toBeInTheDocument();
    expect(screen.getByText("courseDetails.unlockLearningDescription")).toBeInTheDocument();
  });

  it("renders Login button", () => {
    renderComponent();
    expect(screen.getByRole("button", { name: "login" })).toBeInTheDocument();
  });

  it("has login-to-unlock-card test id", () => {
    renderComponent();
    expect(screen.getByTestId("login-to-unlock-card")).toBeInTheDocument();
  });

  it("navigates to /portal/login?prompt=none&returnTo=<current-path> when Login button is clicked", () => {
    renderComponent("/collection/do_21455514901173043212");
    const loginButton = screen.getByRole("button", { name: "login" });
    fireEvent.click(loginButton);
    expect(window.location.href).toBe(
      "/portal/login?prompt=none&returnTo=%2Fcollection%2Fdo_21455514901173043212"
    );
  });
});
