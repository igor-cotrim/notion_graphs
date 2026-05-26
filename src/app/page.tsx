import { getCurrentUser } from "@/lib/auth";
import { HomePageClient } from "@/components/HomePageClient";

export default async function Home() {
  const user = await getCurrentUser();
  return <HomePageClient user={user} />;
}
