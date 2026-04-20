import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  notionWorkspaceId: text("notion_workspace_id").notNull(),
  notionWorkspaceName: text("notion_workspace_name"),
  notionWorkspaceIcon: text("notion_workspace_icon"),
  notionOwnerId: text("notion_owner_id"),
  notionAccessTokenEnc: text("notion_access_token_enc").notNull(),
  notionRefreshTokenEnc: text("notion_refresh_token_enc"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
