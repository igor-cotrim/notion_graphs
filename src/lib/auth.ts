import { redirect } from "next/navigation";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "./db/client";
import { users } from "./db/schema";
import { getSession } from "./session";

export type CurrentUser = {
  id: string;
  workspaceId: string;
  workspaceName: string | null;
  workspaceIcon: string | null;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;
  const rows = await db
    .select({
      id: users.id,
      workspaceId: users.notionWorkspaceId,
      workspaceName: users.notionWorkspaceName,
      workspaceIcon: users.notionWorkspaceIcon,
    })
    .from(users)
    .where(eq(users.id, session.uid))
    .limit(1);
  return rows[0] ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}
