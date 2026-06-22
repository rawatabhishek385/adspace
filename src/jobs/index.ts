import cron from "node-cron";
import { runInactiveUserReminder } from "./inactiveUserReminder";
import { runReviewReminder } from "./reviewReminder";
import { runRecommendationCleanup } from "./recommendationEngine";
import { runNearbyNotificationJob } from "./nearbyNotificationJob";
import { runWeeklyEmailJob } from "./weeklyEmailJob";
import { runTrendingEngine } from "./trendingEngine";
import { runSavedSearchAlertJob } from "./savedSearchAlertJob";
import { runCampaignJob } from "./campaignJob";

console.log("🚀 Starting Background Jobs Scheduler...");

// 0. Campaign Job: Runs every minute to process scheduled/instant campaigns
cron.schedule("* * * * *", () => {
  runCampaignJob();
});

// 1. Inactive User Reminder: Runs daily at 10:00 AM
cron.schedule("0 10 * * *", () => {
  console.log("⏰ Running Inactive User Reminder Job...");
  runInactiveUserReminder();
});

// 2. Review Reminder: Runs daily at 9:00 AM
cron.schedule("0 9 * * *", () => {
  console.log("⏰ Running Review Reminder Job...");
  runReviewReminder();
});

// 3. Recommendation Cache Update: Runs every 6 hours (0, 6, 12, 18)
cron.schedule("0 */6 * * *", () => {
  console.log("⏰ Running Recommendation Engine Update...");
  runRecommendationCleanup();
});

// 4. Nearby Notifications: Runs every hour at minute 15
cron.schedule("15 * * * *", () => {
  console.log("⏰ Running Nearby Notification Job...");
  runNearbyNotificationJob();
});

// 5. Trending Engine: Runs every hour at minute 30
cron.schedule("30 * * * *", () => {
  console.log("⏰ Running Trending Engine Job...");
  runTrendingEngine();
});

// 6. Weekly Email: Runs every Sunday at 10:00 AM
cron.schedule("0 10 * * 0", () => {
  console.log("⏰ Running Weekly Email Job...");
  runWeeklyEmailJob();
});

// 7. Saved Search Alerts: Runs every hour
cron.schedule("0 * * * *", () => {
  console.log("⏰ Running Saved Search Alert Job...");
  runSavedSearchAlertJob();
});

console.log("✅ Jobs Scheduled Successfully");
