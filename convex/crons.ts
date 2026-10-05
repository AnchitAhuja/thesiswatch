import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
// IST is UTC + 05:30 throughout the year.
crons.weekly(
  "send latest AI edition",
  { dayOfWeek: "saturday", hourUTC: 4, minuteUTC: 30 },
  internal.mail.sendWeekly,
  {},
);
export default crons;
