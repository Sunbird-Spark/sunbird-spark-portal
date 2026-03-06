import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CourseProgressSection from "./CourseProgressSection";

const mockNavigate = vi.fn();
const mockInvalidateQueries = vi.fn();
const mockMutateAsync = vi.fn();
const mockToast = vi.fn();
const mockT = vi.fn((key: string) => key);

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

vi.mock("@/hooks/useBatch", () => ({
  useUnenrol: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@/hooks/useAppI18n", () => ({
  useAppI18n: () => ({ t: mockT }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("./CourseProgressCard", () => ({
  default: ({
    showUnenrollOption,
    onUnenroll,
    ...rest
  }: {
    showUnenrollOption?: boolean;
    onUnenroll?: () => void;
    totalContentCount?: number;
    [key: string]: unknown;
  }) => (
    <div data-testid="course-progress-card" data-show-unenroll-option={String(!!showUnenrollOption)}>
      {rest.totalContentCount != null && (
        <span data-testid="progress">{String(rest.totalContentCount)}</span>
      )}
      {showUnenrollOption && onUnenroll && (
        <button type="button" data-testid="trigger-unenrol" onClick={onUnenroll}>
          Leave course
        </button>
      )}
    </div>
  ),
}));

vi.mock("@/components/common/ConfirmDialog", () => ({
  default: ({
    open,
    onClose,
    onConfirm,
    title,
    description,
  }: {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
  }) =>
    open ? (
      <div data-testid="confirm-dialog" role="dialog" aria-label={title}>
        <p data-testid="confirm-description">{description}</p>
        <button type="button" data-testid="confirm-close" onClick={onClose}>
          Cancel
        </button>
        <button type="button" data-testid="confirm-submit" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    ) : null,
}));

const defaultCourseProgressProps = {
  totalContentCount: 10,
  completedContentCount: 3,
};

const baseProps = {
  collectionId: "col_1",
  batchIdParam: "batch_1",
  userId: "user_1",
  isTrackable: true,
  contentBlocked: false,
  contentCreatorPrivilege: false,
  hasBatchInRoute: true,
  isEnrolledInCurrentBatch: true,
  courseProgressProps: defaultCourseProgressProps,
  showForceSyncButton: false,
  isForceSyncing: false,
};

describe("CourseProgressSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ data: {}, status: 200, headers: {} });
  });

  describe("Leave course visibility rules", () => {
    it("shows leave course option when eligible and showForceSyncButton is false", () => {
      render(<CourseProgressSection {...baseProps} />);
      const card = screen.getByTestId("course-progress-card");
      expect(card).toHaveAttribute("data-show-unenroll-option", "true");
      expect(screen.getByTestId("trigger-unenrol")).toBeInTheDocument();
    });

    it("hides leave course option when showForceSyncButton is true", () => {
      render(<CourseProgressSection {...baseProps} showForceSyncButton />);
      const card = screen.getByTestId("course-progress-card");
      expect(card).toHaveAttribute("data-show-unenroll-option", "false");
      expect(screen.queryByTestId("trigger-unenrol")).not.toBeInTheDocument();
    });

    it("hides leave course option when progress is 100%", () => {
      render(
        <CourseProgressSection
          {...baseProps}
          courseProgressProps={{ totalContentCount: 10, completedContentCount: 10 }}
        />
      );
      const card = screen.getByTestId("course-progress-card");
      expect(card).toHaveAttribute("data-show-unenroll-option", "false");
    });

    it("hides leave course option when not trackable", () => {
      render(<CourseProgressSection {...baseProps} isTrackable={false} />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
    });

    it("hides leave course option when content blocked", () => {
      render(<CourseProgressSection {...baseProps} contentBlocked />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
    });

    it("shows leave course option when content blocked but upcoming batch (so user can unenrol before start)", () => {
      render(
        <CourseProgressSection
          {...baseProps}
          contentBlocked
          upcomingBatchBlocked
        />
      );
      const card = screen.getByTestId("course-progress-card");
      expect(card).toHaveAttribute("data-show-unenroll-option", "true");
      expect(screen.getByTestId("trigger-unenrol")).toBeInTheDocument();
    });

    it("hides leave course option when content creator privilege", () => {
      render(<CourseProgressSection {...baseProps} contentCreatorPrivilege />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
    });

    it("hides leave course option when no batch in route", () => {
      render(<CourseProgressSection {...baseProps} hasBatchInRoute={false} />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
    });

    it("hides leave course option when not enrolled in current batch", () => {
      render(<CourseProgressSection {...baseProps} isEnrolledInCurrentBatch={false} />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
    });

    it("hides leave course option when collectionId or batchIdParam is missing", () => {
      const { unmount } = render(<CourseProgressSection {...baseProps} collectionId={undefined} />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
      unmount();
      render(<CourseProgressSection {...baseProps} batchIdParam={undefined} />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
    });

    it("hides leave course option when userId is null", () => {
      render(<CourseProgressSection {...baseProps} userId={null} />);
      expect(screen.getByTestId("course-progress-card")).toHaveAttribute(
        "data-show-unenroll-option",
        "false"
      );
    });
  });

  describe("Confirm dialog flow", () => {
    it("opens confirm dialog when leave course is clicked", () => {
      render(<CourseProgressSection {...baseProps} />);
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
      fireEvent.click(screen.getByTestId("trigger-unenrol"));
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      expect(screen.getByTestId("confirm-description")).toHaveTextContent(
        "courseDetails.leaveCourseDescription"
      );
    });

    it("closes dialog when cancel is clicked", () => {
      render(<CourseProgressSection {...baseProps} />);
      fireEvent.click(screen.getByTestId("trigger-unenrol"));
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
      fireEvent.click(screen.getByTestId("confirm-close"));
      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });
  });

  describe("Query invalidation and navigation on success", () => {
    it("invalidates userEnrollments and contentState and navigates to collection on confirm success", async () => {
      render(<CourseProgressSection {...baseProps} />);
      fireEvent.click(screen.getByTestId("trigger-unenrol"));
      fireEvent.click(screen.getByTestId("confirm-submit"));

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          courseId: "col_1",
          userId: "user_1",
          batchId: "batch_1",
        });
      });

      await waitFor(() => {
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["userEnrollments"] });
        expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["contentState"] });
        expect(mockNavigate).toHaveBeenCalledWith("/collection/col_1");
      });

      expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
    });

    it("does not close dialog or navigate on unenrol failure", async () => {
      mockMutateAsync.mockRejectedValue(new Error("Network error"));
      render(<CourseProgressSection {...baseProps} />);
      fireEvent.click(screen.getByTestId("trigger-unenrol"));
      fireEvent.click(screen.getByTestId("confirm-submit"));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            variant: "destructive",
            description: "Network error",
          })
        );
      });

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByTestId("confirm-dialog")).toBeInTheDocument();
    });
  });
});
