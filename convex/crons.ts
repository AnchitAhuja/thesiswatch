import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
// IST is UTC + 05:30 throughout the year.
// startWeekly ignores dates before October 10, 2026 and is enabled only in production.
crons.weekly(
  "research weekly AI thesis",
  { dayOfWeek: "saturday", hourUTC: 3, minuteUTC: 30 },
  internal.research.startWeekly,
  {},
);
crons.weekly(
  "send latest AI edition",
  { dayOfWeek: "saturday", hourUTC: 4, minuteUTC: 30 },
  internal.mail.sendWeekly,
  {},
);
export default crons;
