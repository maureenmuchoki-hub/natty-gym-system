import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/requireAuth";

export default async function Home() {
  const user = await getAuthUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/login");
}