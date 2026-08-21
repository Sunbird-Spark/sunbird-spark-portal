export const getCompletionStatus = (
    status: number,
    completionPercentage: number
): "not-started" | "ongoing" | "completed" => {
    if (status === 2 || completionPercentage >= 100) return "completed";
    if (status === 1) return "ongoing";
    return "not-started";
};
