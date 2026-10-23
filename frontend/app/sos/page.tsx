import { redirect } from "next/navigation";

export default function SOSRoute() {
  redirect("/authority-dashboard?tab=sos");
}
