import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(value: Date | string | number): string {
  const date = dayjs(value);
  if (date.isValid()) {
    return date.fromNow();
  }
  return "Invalid date";
}
