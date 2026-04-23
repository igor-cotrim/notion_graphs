import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { StoredDbState } from "@/lib/types";

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

export const folders = pgTable(
  "folders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("folders_user_idx").on(t.userId, t.position)],
);

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;

export const savedDbs = pgTable(
  "saved_dbs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    folderId: text("folder_id")
      .notNull()
      .references(() => folders.id, { onDelete: "cascade" }),
    notionDbId: text("notion_db_id").notNull(),
    label: text("label").notNull(),
    state: jsonb("state").$type<StoredDbState>(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("saved_dbs_folder_idx").on(t.folderId, t.position),
    uniqueIndex("saved_dbs_folder_db_uniq").on(t.folderId, t.notionDbId),
  ],
);

export type SavedDbRow = typeof savedDbs.$inferSelect;
export type NewSavedDbRow = typeof savedDbs.$inferInsert;
