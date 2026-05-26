export const en = {
  common: {
    loading: "Loading…",
  },
  chart: {
    noData: "No data.",
  },
  embed: {
    unavailable: "This chart is no longer available.",
    noState: "This chart has no saved state yet.",
    invalidToken: "Invalid embed token.",
    disconnected:
      "This chart is no longer available — the owner disconnected their Notion workspace.",
  },
  folders: {
    databases: "Databases",
    newDb: "+ New",
    newFolder: "+ Folder",
    folderNamePlaceholder: "Folder name",
    emptyState: "Create a folder to start pinning Notion databases.",
    renameFolder: "Rename folder",
    deleteFolder: "Delete folder",
    deleteFolderEmpty: "Delete this folder?",
    deleteFolderWithDb: "Delete folder and its {count} DB?",
    deleteFolderWithDbs: "Delete folder and its {count} DBs?",
    delete: "Delete",
    cancel: "Cancel",
    saveCurrentDb: "+ Save current DB",
    saveLabelPlaceholder: "Label (e.g. Budget 04/2026)",
    rename: "Rename",
    moveTo: "Move to",
    dragToReorder: "Drag to reorder",
  },
  preview: {
    heading: "Preview",
    signOut: "Sign out",
    databaseId: "Database ID",
    databaseIdHint:
      "Open the database as a full page in Notion, copy the URL. The ID is the 32-character code at the end:",
    refreshing: "Refreshing…",
    refreshed: "Refreshed",
    refreshData: "Refresh data",
    chartType: "Chart type",
    groupBy: "Group by",
    valueField: "Value",
    aggregation: "Aggregation",
    titleField: "Title",
    titlePlaceholder: "(optional)",
    filterLabel: "Filter — {prop}",
    noFilterValues: "no values",
    generateEmbed: "Generate embed URL",
    generating: "Generating…",
    saveTip: "Save this database to a folder to generate a stable embed URL.",
    embedTip: "Tip: paste the URL (not the iframe) into Notion → Create embed.",
    copy: "copy",
    copied: "copied ✓",
    hintNoDb: "Enter a Notion database ID in the sidebar to begin.",
    hintFailed: "Failed to load database:",
    hintFailedSub: "Make sure the integration is shared with this database.",
    hintEmpty: "Database is empty.",
  },
  home: {
    signOut: "Sign out",
    openPreview: "Open preview →",
    workspaceConnected: "{name} connected",
    workspaceConnectedGeneric: "Workspace connected",
    connectNotion: "Connect Notion →",
    heroTitle1: "Notion,",
    heroTitle2: "charted.",
    heroSubtitle:
      "Turn any Notion database into an embeddable chart. Connect your workspace, shape the data, and paste a signed embed URL back into Notion.",
    step01Title: "Connect",
    step01Desc:
      "Authorize this app to read selected databases in your workspace.",
    step02Title: "Configure",
    step02Desc:
      "Paste a database ID, choose how to group, aggregate, and chart it.",
    step03Title: "Generate",
    step03Desc: "Click Generate embed URL for a signed, public-access link.",
    step04Title: "Embed",
    step04Desc: "Paste the URL (not the iframe) into Notion → Create embed.",
  },
} as const;

export type Translations = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
