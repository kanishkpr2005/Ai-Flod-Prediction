import { redirect } from "next/navigation";

export default function PredictionsRoute() {
  redirect("/authority-dashboard?tab=predictions");
}
