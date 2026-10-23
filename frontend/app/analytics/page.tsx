import { redirect } from "next/navigation";

export default function AnalyticsRoute() {
  redirect("/authority-dashboard?tab=analytics");
}
