import { redirect } from "next/navigation";

export default function RescueRoute() {
  redirect("/authority-dashboard?tab=rescue");
}
