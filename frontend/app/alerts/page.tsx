import { redirect } from "next/navigation";

export default function AlertsRoute() {
  redirect("/authority-dashboard?tab=alerts");
}
