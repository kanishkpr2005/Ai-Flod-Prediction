import { redirect } from "next/navigation";

export default function MapRoute() {
  redirect("/authority-dashboard?tab=map");
}
