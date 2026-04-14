import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import LoginToUnlockCard from "./LoginToUnlockCard";

vi.mock("@/hooks/useAppI18n", () => ({
  useAppI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("LoginToUnlockCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as unknown as { location?: unknown }).location;
    (window as unknown as { location: { href: string } }).location = { href: "" };
  });

  it("renders with title and description from translations", () => {
    render(<LoginToUnlockCard />);
    expect(screen.getByText("courseDetails.unlockLearningTitle")).toBeInTheDocument();
    expect(screen.getByText("courseDetails.unlockLearningDescription")).toBeInTheDocument();
  });

  it("renders Login button", () => {
    render(<LoginToUnlockCard />);
    expect(screen.getByRole("button", { name: "login" })).toBeInTheDocument();
  });

  it("has login-to-unlock-card test id", () => {
    render(<LoginToUnlockCard />);
    expect(screen.getByTestId("login-to-unlock-card")).toBeInTheDocument();
  });

  it("navigates to /portal/login?prompt=none when Login button is clicked", () => {
    render(<LoginToUnlockCard />);
    const loginButton = screen.getByRole("button", { name: "login" });
    fireEvent.click(loginButton);
    expect(window.location.href).toBe("/portal/login?prompt=none");
  });
});
