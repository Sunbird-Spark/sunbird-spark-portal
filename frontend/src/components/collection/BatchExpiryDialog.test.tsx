import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BatchExpiryDialog from "./BatchExpiryDialog";

vi.mock("@/hooks/useAppI18n", () => ({
  useAppI18n: () => ({
    t: (key: string, vars?: Record<string, string>) => {
      if (vars?.date) return `${key}:${vars.date}`;
      return key;
    },
  }),
}));

vi.mock("@/services/collection/enrollmentMapper", () => ({
  formatBatchDisplayDate: (date: string | undefined) => date ?? "-",
}));

vi.mock("@/components/common/Dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const baseProps = {
  isBatchEnded: false,
  isBatchExpiringSoon: false,
  batchEndDate: undefined,
  isEnrolledInCurrentBatch: true,
  collectionId: "col-1",
  contentCreatorPrivilege: false,
};

describe("BatchExpiryDialog", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("does not open when neither ended nor expiring soon", () => {
    renderWithQuery(<BatchExpiryDialog {...baseProps} />);
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("does not open when not enrolled", () => {
    renderWithQuery(
      <BatchExpiryDialog {...baseProps} isBatchEnded isEnrolledInCurrentBatch={false} />,
    );
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("does not open for content creator privilege", () => {
    renderWithQuery(
      <BatchExpiryDialog {...baseProps} isBatchEnded contentCreatorPrivilege />,
    );
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("opens with ended variant when batch has ended", () => {
    renderWithQuery(<BatchExpiryDialog {...baseProps} isBatchEnded />);
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("courseDetails.batchEndedTitle")).toBeInTheDocument();
    expect(screen.getByText("courseDetails.batchExpiredProgressWarning")).toBeInTheDocument();
  });

  it("opens with expiring-soon variant when batch is expiring soon", () => {
    renderWithQuery(
      <BatchExpiryDialog
        {...baseProps}
        isBatchExpiringSoon
        batchEndDate="2025-06-17"
      />,
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
    expect(screen.getByText("courseDetails.batchExpiringSoonTitle")).toBeInTheDocument();
    expect(
      screen.getByText("courseDetails.batchExpiringSoonWarning:2025-06-17"),
    ).toBeInTheDocument();
  });

  it("shows ended variant (not expiring-soon) when both flags are true", () => {
    renderWithQuery(
      <BatchExpiryDialog {...baseProps} isBatchEnded isBatchExpiringSoon />,
    );
    expect(screen.getByText("courseDetails.batchEndedTitle")).toBeInTheDocument();
    expect(screen.queryByText("courseDetails.batchExpiringSoonTitle")).toBeNull();
  });

  it("does not open again for same collectionId after sessionStorage is set", () => {
    sessionStorage.setItem("batch-expiry-dialog-shown:col-1", "1");
    renderWithQuery(<BatchExpiryDialog {...baseProps} isBatchEnded />);
    expect(screen.queryByTestId("dialog")).toBeNull();
  });

  it("opens for a different collectionId even if another was suppressed", () => {
    sessionStorage.setItem("batch-expiry-dialog-shown:col-1", "1");
    renderWithQuery(
      <BatchExpiryDialog {...baseProps} collectionId="col-2" isBatchEnded />,
    );
    expect(screen.getByTestId("dialog")).toBeInTheDocument();
  });

  it("does not open when collectionId is undefined", () => {
    renderWithQuery(
      <BatchExpiryDialog {...baseProps} collectionId={undefined} isBatchEnded />,
    );
    expect(screen.queryByTestId("dialog")).toBeNull();
  });
});
