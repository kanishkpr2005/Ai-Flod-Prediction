import { redirect } from "next/navigation";

export default function DashboardRoute() {
  redirect("/authority-dashboard?tab=overview");
}
