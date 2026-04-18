// Format match dates in Indian Standard Time (IST), regardless of viewer's timezone.
// Output examples: "Sat, 22 Mar • 7:30 PM IST", "22 Mar 2026, 19:30 IST"

const IST = "Asia/Kolkata";

/** Day, DD Mon • H:MM AM/PM IST  →  "Sat, 22 Mar • 7:30 PM IST" */
export const formatMatchIST = (input: string | Date | null | undefined): string => {
  if (!input) return "TBD";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "TBD";
  const date = d.toLocaleDateString("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  const time = d.toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} • ${time} IST`;
};

/** Includes year — "Sat, 22 Mar 2026 • 7:30 PM IST" */
export const formatMatchISTLong = (input: string | Date | null | undefined): string => {
  if (!input) return "TBD";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "TBD";
  const date = d.toLocaleDateString("en-IN", {
    timeZone: IST,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-IN", {
    timeZone: IST,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${date} • ${time} IST`;
};

/** Compact date-only IST — "22 Mar 2026" */
export const formatDateIST = (input: string | Date | null | undefined): string => {
  if (!input) return "TBD";
  const d = new Date(input);
  if (isNaN(d.getTime())) return "TBD";
  return d.toLocaleDateString("en-IN", {
    timeZone: IST,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};
