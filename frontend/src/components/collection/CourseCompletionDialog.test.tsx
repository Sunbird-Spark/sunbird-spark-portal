import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CourseCompletionDialog from "./CourseCompletionDialog";
import type { CourseProgressCardProps } from "./CourseProgressCard";

vi.mock("@/hooks/useAppI18n", () => ({
  useAppI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        congratulations: "congratulations",
        "courseDetails.courseCompletionMessage": "You have successfully completed the course",
        "courseDetails.courseCompletionNoCertificateNote": "Note: This course does not have a certificate",
        "courseDetails.courseCompletionCertificateNote":
          "You can download your course certificate from your Profile page once it is generated",
        close: "Close",
      };
      return map[key] ?? key;
    },
  }),
}));

function renderWithQuery(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("CourseCompletionDialog", () => {
  const baseProgress: CourseProgressCardProps = {
    batchStartDate: undefined,
    totalContentCount: 10,
    completedContentCount: 5,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("does not show dialog when progress is already 100% on first render", () => {
    renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={{ ...baseProgress, completedContentCount: 10 }}
        isEnrolledInCurrentBatch
        collectionId="col-1"
        hasCertificate={false}
      />,
    );
    expect(screen.queryByText("congratulations")).toBeNull();
  });

  it("opens dialog when progress transitions from < 100 to 100", () => {
    const { rerender } = renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={baseProgress}
        isEnrolledInCurrentBatch
        collectionId="col-1"
        hasCertificate={false}
      />,
    );

    expect(screen.queryByText("congratulations")).toBeNull();

    const completed: CourseProgressCardProps = {
      ...baseProgress,
      completedContentCount: 10,
    };
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={completed}
          isEnrolledInCurrentBatch
          collectionId="col-1"
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText("congratulations")).toBeInTheDocument();
    expect(
      screen.getByText("You have successfully completed the course"),
    ).toBeInTheDocument();
  });

  it("shows no-certificate note when hasCertificate is false", () => {
    const completed: CourseProgressCardProps = {
      ...baseProgress,
      completedContentCount: 10,
    };

    const { rerender } = renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={baseProgress}
        isEnrolledInCurrentBatch
        collectionId="col-1"
        hasCertificate={false}
      />,
    );

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={completed}
          isEnrolledInCurrentBatch
          collectionId="col-1"
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText("Note: This course does not have a certificate"),
    ).toBeInTheDocument();
  });

  it("shows certificate note when hasCertificate is true", () => {
    const completed: CourseProgressCardProps = {
      ...baseProgress,
      completedContentCount: 10,
    };

    const { rerender } = renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={baseProgress}
        isEnrolledInCurrentBatch
        collectionId="col-1"
        hasCertificate
      />,
    );

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={completed}
          isEnrolledInCurrentBatch
          collectionId="col-1"
          hasCertificate
        />
      </QueryClientProvider>,
    );

    expect(
      screen.getByText(
        "You can download your course certificate from your Profile page once it is generated",
      ),
    ).toBeInTheDocument();
  });

  it("does not open dialog when navigating to a different collection already at 100%", () => {
    const { rerender } = renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={baseProgress}
        isEnrolledInCurrentBatch
        collectionId="col-A"
        hasCertificate={false}
      />,
    );
    expect(screen.queryByText("congratulations")).toBeNull();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={{ ...baseProgress, completedContentCount: 10 }}
          isEnrolledInCurrentBatch
          collectionId="col-B"
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryByText("congratulations")).toBeNull();
  });

  it("skips progress check when totalContentCount is 0 (line 51)", () => {
    const { rerender } = renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={{ batchStartDate: undefined, totalContentCount: 0, completedContentCount: 0 }}
        isEnrolledInCurrentBatch
        collectionId="col-1"
        hasCertificate={false}
      />,
    );

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={{ batchStartDate: undefined, totalContentCount: 0, completedContentCount: 0 }}
          isEnrolledInCurrentBatch
          collectionId="col-1"
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );

    // No dialog should open when totalContentCount is 0
    expect(screen.queryByText("congratulations")).toBeNull();
  });

  it("resets state when collectionId is undefined (line 34)", () => {
    const { rerender } = renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={baseProgress}
        isEnrolledInCurrentBatch
        collectionId={undefined}
        hasCertificate={false}
      />,
    );

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={{ ...baseProgress, completedContentCount: 10 }}
          isEnrolledInCurrentBatch
          collectionId={undefined}
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );

    expect(screen.queryByText("congratulations")).toBeNull();
  });

  it("opens dialog only once per collection when progress fluctuates 90→100→90→100", () => {
    const { rerender } = renderWithQuery(
      <CourseCompletionDialog
        courseProgressProps={{ ...baseProgress, completedContentCount: 9 }}
        isEnrolledInCurrentBatch
        collectionId="col-1"
        hasCertificate={false}
      />,
    );
    const completed: CourseProgressCardProps = {
      ...baseProgress,
      completedContentCount: 10,
    };
    const ninety: CourseProgressCardProps = {
      ...baseProgress,
      completedContentCount: 9,
    };

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={completed}
          isEnrolledInCurrentBatch
          collectionId="col-1"
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );
    expect(screen.getByText("congratulations")).toBeInTheDocument();

    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={ninety}
          isEnrolledInCurrentBatch
          collectionId="col-1"
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );
    rerender(
      <QueryClientProvider client={new QueryClient()}>
        <CourseCompletionDialog
          courseProgressProps={completed}
          isEnrolledInCurrentBatch
          collectionId="col-1"
          hasCertificate={false}
        />
      </QueryClientProvider>,
    );
    expect(screen.queryAllByText("congratulations")).toHaveLength(1);
  });
});
