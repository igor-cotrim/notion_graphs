import type { Translations } from "./en";

export const ptBR: Translations = {
  common: {
    loading: "Carregando…",
  },
  chart: {
    noData: "Sem dados.",
  },
  embed: {
    unavailable: "Este gráfico não está mais disponível.",
    noState: "Este gráfico ainda não tem estado salvo.",
    invalidToken: "Token de incorporação inválido.",
    disconnected:
      "Este gráfico não está mais disponível — o proprietário desconectou seu workspace do Notion.",
  },
  folders: {
    databases: "Bancos de Dados",
    newDb: "+ Novo",
    newFolder: "+ Pasta",
    folderNamePlaceholder: "Nome da pasta",
    emptyState: "Crie uma pasta para fixar seus bancos de dados do Notion.",
    renameFolder: "Renomear pasta",
    deleteFolder: "Excluir pasta",
    deleteFolderEmpty: "Excluir esta pasta?",
    deleteFolderWithDb: "Excluir pasta e seu {count} BD?",
    deleteFolderWithDbs: "Excluir pasta e seus {count} BDs?",
    delete: "Excluir",
    cancel: "Cancelar",
    saveCurrentDb: "+ Salvar BD atual",
    saveLabelPlaceholder: "Nome (ex. Orçamento 04/2026)",
    rename: "Renomear",
    moveTo: "Mover para",
    dragToReorder: "Arraste para reordenar",
  },
  preview: {
    heading: "Visualização",
    signOut: "Sair",
    databaseId: "ID do Banco de Dados",
    databaseIdHint:
      "Abra o banco de dados como página completa no Notion, copie a URL. O ID é o código de 32 caracteres no final:",
    refreshing: "Atualizando…",
    refreshed: "Atualizado",
    refreshData: "Atualizar dados",
    chartType: "Tipo de gráfico",
    groupBy: "Agrupar por",
    valueField: "Valor",
    aggregation: "Agregação",
    titleField: "Título",
    titlePlaceholder: "(opcional)",
    filterLabel: "Filtro — {prop}",
    noFilterValues: "sem valores",
    generateEmbed: "Gerar URL de incorporação",
    generating: "Gerando…",
    saveTip:
      "Salve este banco de dados em uma pasta para gerar uma URL de incorporação estável.",
    embedTip: "Dica: cole a URL (não o iframe) no Notion → Criar incorporação.",
    copy: "copiar",
    copied: "copiado ✓",
    hintNoDb:
      "Insira um ID de banco de dados do Notion na barra lateral para começar.",
    hintFailed: "Falha ao carregar banco de dados:",
    hintFailedSub:
      "Certifique-se de que a integração está compartilhada com este banco de dados.",
    hintEmpty: "O banco de dados está vazio.",
  },
  home: {
    signOut: "Sair",
    openPreview: "Abrir visualização →",
    workspaceConnected: "{name} conectado",
    workspaceConnectedGeneric: "Workspace conectado",
    connectNotion: "Conectar Notion →",
    heroTitle1: "Notion,",
    heroTitle2: "em gráficos.",
    heroSubtitle:
      "Transforme qualquer banco de dados do Notion em um gráfico incorporável. Conecte seu workspace, molde os dados e cole uma URL de incorporação assinada de volta no Notion.",
    step01Title: "Conectar",
    step01Desc:
      "Autorize este app a ler os bancos de dados selecionados no seu workspace.",
    step02Title: "Configurar",
    step02Desc:
      "Cole um ID de banco de dados e escolha como agrupar, agregar e exibir em gráfico.",
    step03Title: "Gerar",
    step03Desc:
      "Clique em Gerar URL de incorporação para obter um link público e assinado.",
    step04Title: "Incorporar",
    step04Desc: "Cole a URL (não o iframe) no Notion → Criar incorporação.",
  },
} as const;
