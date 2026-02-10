import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Relative time for workspace (e.g. "2 days ago"), aligned with SunbirdEd-portal fromNow pipe */
export function formatTimeAgo(value: Date | string | number): string {
  const local = dayjs(value).format("YYYY-MM-DD HH:mm:ss");
  if (dayjs(local).isValid()) {
    return dayjs(local).fromNow();
  }
  return "Invalid date";
}
