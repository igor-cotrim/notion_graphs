import { Client } from "@notionhq/client";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "./db/client";
import { users } from "./db/schema";
import { decrypt } from "./crypto";

export const getNotionClientForUser = cache(async (userId: string): Promise<Client> => {
  const rows = await db
    .select({ token: users.notionAccessTokenEnc })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  if (!row) throw new Error(`No Notion credentials for user ${userId}`);
  const auth = decrypt(row.token);
  return new Client({ auth });
});
