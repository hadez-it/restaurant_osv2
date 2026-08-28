import { redirect } from "next/navigation";
import { getSessionUser, homeFor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default function Home() {
  const user = getSessionUser();
  if (!user) redirect("/login");
  redirect(homeFor(user.role));
}
