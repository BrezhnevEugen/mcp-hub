let state = null;
let activeProfile = "all";
let selectedServer = null;
let activeLocale = "en";

const I18N = {
  en: {
    add: "Add",
    address: "Address",
    addressPlaceholder: "https://example.com/mcp",
    addressRequired: "Address is required",
    accessToken: "Token",
    actions: "Actions",
    activityFeed: "Activity Feed",
    activitySubtitle: "Latest registry, scan, config, and server events.",
    allProfiles: "all profiles",
    allProfileName: "all",
    availableActions: "Available Actions",
    baseline: "baseline",
    catalog: "Catalog",
    changed: "changed",
    client: "Client",
    close: "Close",
    command: "Command",
    configEndpoint: "Config Endpoint",
    configResponse: "Config Response",
    delete: "Delete",
    deleteConfirm: "Delete {server} from MCP Hub?",
    deleted: "Deleted {server}",
    description: "Description",
    details: "Details",
    documentation: "Documentation",
    documentationIntro: "Local guide for the hub contract: registry, profiles, scans, and config requests.",
    documentationSubtitle: "How agents request MCP settings from MCP Hub.",
    disabledStatus: "disabled",
    disable: "Disable",
    documentTitle: "MCP Hub",
    done: "Done",
    enabled: "Enabled",
    enabledStatus: "enabled",
    enable: "Enable",
    env: "Environment",
    eventConfigRequest: "Served config for {count} server(s) to {client}",
    eventImport: "Imported {count} server(s) from {client}",
    eventProfileUpdate: "Updated profile {profile}",
    eventScan: "Scanned {count} server(s)",
    eventServerCreate: "Added server {server}",
    eventServerDelete: "Deleted server {server}",
    eventServerDisable: "Disabled server {server}",
    eventServerEnable: "Enabled server {server}",
    headers: "Headers",
    getConfig: "Get Config",
    importedServers: "Imported {count} server(s)",
    import: "Import",
    invalidAddress: "Enter a valid URL or hostname",
    localeLabel: "Locale",
    locale_en: "English",
    locale_ru: "Russian",
    manualAdd: "Manual Add",
    mcpServers: "MCP Servers",
    name: "Name",
    noActionsScanned: "No actions scanned yet",
    noDescription: "No description",
    noEvents: "No events yet",
    noServersScanned: "No servers scanned",
    open: "Open",
    openCard: "Open Card",
    openDocs: "Open Docs",
    operations: "Operations",
    optional: "optional",
    path: "Path",
    profile: "Profile",
    profileName: "profile {profile}",
    profiles: "Profiles",
    progressSummary: "Progress Summary",
    progressSubtitle: "Operational state: stats, done, and remaining work.",
    refreshed: "Refreshed",
    remoteHttp: "remote http",
    remaining: "Remaining",
    refresh: "Refresh",
    runScan: "Run Scan",
    scan: "Scan",
    scanToast: "Scan: {changed} changed, {broken} broken",
    scanOkSummary: "{count} action(s), {marker}",
    scanStats: "{changed} changed, {broken} broken, {skipped} skipped",
    scanning: "Scanning...",
    searchServers: "Search servers",
    serverAdded: "Added {server}",
    serverAddedScanFailed: "Added {server}; scan failed: {error}",
    serverAddedScanning: "Added {server}; scanning actions...",
    serverAddedWithActions: "Added {server}; found {count} action(s)",
    serverDisabled: "{server} disabled",
    serverEnabled: "{server} enabled",
    serverSection: "Server",
    serverSummary: "{servers} server(s), {enabled} enabled, {profile}",
    statistics: "Statistics",
    statsActions: "Actions",
    statsAssigned: "Assigned",
    statsEvents: "Events",
    statsProfiles: "Profiles",
    statsScanned: "Scanned",
    statsServers: "Servers",
    status: "Status",
    stdio: "Stdio",
    taskActionsScanned: "{count} server(s) have scanned actions.",
    taskAddServers: "Import or add MCP servers to start the catalog.",
    taskCatalogReady: "Catalog has {count} server(s).",
    taskEventsReady: "Activity history is enabled.",
    taskConfigReady: "Config endpoint supports {count} client(s).",
    taskProfilesReady: "{count} profile(s) are configured.",
    taskReviewDisabled: "Review {count} disabled server(s).",
    taskRunFirstEvent: "Run an operation to populate the activity history.",
    taskScanMissing: "Scan {count} server(s) without action metadata.",
    taskUnassigned: "Assign {count} server(s) to profiles.",
    taskNoRemaining: "No open operational items.",
    tags: "Tags",
    target: "Command / URL",
    tokenPlaceholder: "sk-...",
    tokenRequired: "Token is required",
    transport: "Transport",
    unchanged: "unchanged",
    unitSubtitle: "{transport} · {actions} action(s) · {status}",
    url: "URL",
    versionBadge: "v{version} · catalog v{catalog} · state v{state}",
  },
  ru: {
    add: "Добавить",
    address: "Адрес",
    addressPlaceholder: "https://example.com/mcp",
    addressRequired: "Адрес обязателен",
    accessToken: "Токен",
    actions: "Навыки",
    activityFeed: "Лента событий",
    activitySubtitle: "Последние события реестра, сканирования, настроек и серверов.",
    allProfiles: "все профили",
    allProfileName: "все",
    availableActions: "Доступные навыки",
    baseline: "база",
    catalog: "Каталог",
    changed: "изменено",
    client: "Клиент",
    close: "Закрыть",
    command: "Команда",
    configEndpoint: "Настройки",
    configResponse: "Ответ Hub",
    delete: "Удалить",
    deleteConfirm: "Удалить {server} из MCP Hub?",
    deleted: "Удален {server}",
    description: "Описание",
    details: "Детали",
    documentation: "Документация",
    documentationIntro: "Короткая справка по контракту Hub: реестр, профили, сканирование и запросы настроек.",
    documentationSubtitle: "Как агенты запрашивают MCP-настройки у MCP Hub.",
    disabledStatus: "выключен",
    disable: "Выключить",
    documentTitle: "MCP Hub",
    done: "Сделано",
    enabled: "Активные",
    enabledStatus: "включен",
    enable: "Включить",
    env: "Окружение",
    eventConfigRequest: "Отданы настройки серверов: {count} для {client}",
    eventImport: "Импортировано серверов: {count} из {client}",
    eventProfileUpdate: "Обновлён профиль {profile}",
    eventScan: "Просканировано серверов: {count}",
    eventServerCreate: "Добавлен сервер {server}",
    eventServerDelete: "Удалён сервер {server}",
    eventServerDisable: "Выключен сервер {server}",
    eventServerEnable: "Включен сервер {server}",
    headers: "Заголовки",
    getConfig: "Получить настройки",
    importedServers: "Импортировано серверов: {count}",
    import: "Импорт",
    invalidAddress: "Введите корректный URL или домен",
    localeLabel: "Язык",
    locale_en: "English",
    locale_ru: "Русский",
    manualAdd: "Ручное добавление",
    mcpServers: "MCP-серверы",
    name: "Имя",
    noActionsScanned: "Навыки пока не просканированы",
    noDescription: "Нет описания",
    noEvents: "Событий пока нет",
    noServersScanned: "Нет просканированных серверов",
    open: "Открыть",
    openCard: "Открыть карточку",
    openDocs: "Открыть документацию",
    operations: "Операции",
    optional: "необязательно",
    path: "Путь",
    profile: "Профиль",
    profileName: "профиль {profile}",
    profiles: "Профили",
    progressSummary: "Сводка",
    progressSubtitle: "Операционное состояние: статистика, сделано и что осталось.",
    refreshed: "Обновлено",
    remoteHttp: "remote http",
    remaining: "Осталось",
    refresh: "Обновить",
    runScan: "Запустить сканирование",
    scan: "Сканирование",
    scanToast: "Сканирование: изменено {changed}, ошибок {broken}",
    scanOkSummary: "{count} навык(ов), {marker}",
    scanStats: "изменено {changed}, ошибок {broken}, пропущено {skipped}",
    scanning: "Сканирование...",
    searchServers: "Поиск серверов",
    serverAdded: "Добавлен {server}",
    serverAddedScanFailed: "Добавлен {server}; сканирование не удалось: {error}",
    serverAddedScanning: "Добавлен {server}; сканирую навыки...",
    serverAddedWithActions: "Добавлен {server}; найдено навыков: {count}",
    serverDisabled: "{server} выключен",
    serverEnabled: "{server} включен",
    serverSection: "Сервер",
    serverSummary: "{servers} сервер(ов), включено {enabled}, {profile}",
    statistics: "Статистика",
    statsActions: "Навыки",
    statsAssigned: "В профилях",
    statsEvents: "События",
    statsProfiles: "Профили",
    statsScanned: "Просканировано",
    statsServers: "Серверы",
    status: "Статус",
    stdio: "Stdio",
    taskActionsScanned: "У {count} сервер(ов) есть найденные навыки.",
    taskAddServers: "Импортировать или добавить MCP-серверы в каталог.",
    taskCatalogReady: "В каталоге {count} сервер(ов).",
    taskEventsReady: "История событий включена.",
    taskConfigReady: "Endpoint настроек поддерживает {count} клиент(ов).",
    taskProfilesReady: "Настроено профилей: {count}.",
    taskReviewDisabled: "Проверить выключенные серверы: {count}.",
    taskRunFirstEvent: "Выполнить операцию, чтобы наполнить историю событий.",
    taskScanMissing: "Просканировать серверы без списка навыков: {count}.",
    taskUnassigned: "Привязать серверы к профилям: {count}.",
    taskNoRemaining: "Открытых операционных пунктов нет.",
    tags: "Теги",
    target: "Команда / URL",
    tokenPlaceholder: "sk-...",
    tokenRequired: "Токен обязателен",
    transport: "Транспорт",
    unchanged: "без изменений",
    unitSubtitle: "{transport} · {actions} навык(ов) · {status}",
    url: "URL",
    versionBadge: "v{version} · каталог v{catalog} · состояние v{state}",
  },
};

const DOCS = {
  en: [
    {
      title: "Hub Contract",
      body: "MCP Hub is the source of truth for local MCP settings. It does not write config into agents; agents or adapters request the profile config they need.",
      items: [
        "Use GET /api/config?profile=<name>&client=<client> to request settings.",
        "The profile query parameter is how the caller chooses which server set to receive.",
        "The response contains mcpServers plus the requested profile and client.",
      ],
    },
    {
      title: "What MCP Hub Stores",
      body: "The catalog stores MCP server definitions and the metadata needed to operate them.",
      items: [
        "registry.yaml stores commands, URLs, headers, environment values, tags, descriptions, and scanned actions.",
        "profiles.yaml stores named access sets such as default, content, dev, or all.",
        "tool-snapshots.yaml stores action-name snapshots so scans can detect capability drift.",
      ],
    },
    {
      title: "Profiles",
      body: "A profile is a named set of MCP servers. The caller selects a profile instead of the agent guessing from all servers.",
      items: [
        "GET /api/config?profile=content&client=codex returns only enabled servers in content.",
        "The synthetic profile all returns every enabled server.",
        "Disabled servers stay in the registry but are skipped in config responses and scans.",
      ],
    },
    {
      title: "Operations",
      body: "The UI manages the catalog; the config endpoint serves runtime settings to callers.",
      items: [
        "Import reads an existing client config and merges those servers into the local registry.",
        "Scan connects to stdio or remote HTTP servers, calls tools/list, then stores readable action names and descriptions.",
        "Get Config calls /api/config for the active profile and selected client.",
      ],
    },
    {
      title: "State vs Config",
      body: "MCP Hub exposes two different surfaces: a safe UI state and a sensitive runtime config response.",
      items: [
        "/api/state powers the UI and masks token-like values.",
        "/api/config is for agents and preserves tokens, headers, and environment values.",
        "Treat /api/config responses as sensitive when tokens are present.",
      ],
    },
    {
      title: "Versioning",
      body: "The header badge shows the app version, catalog schema version, and UI state version currently served by the backend.",
      items: [
        "App version tracks the MCP Hub package release.",
        "Catalog schema version tracks registry/profile file shape.",
        "UI state version tracks the /api/state contract consumed by the frontend.",
      ],
    },
  ],
  ru: [
    {
      title: "Контракт Hub",
      body: "MCP Hub - источник правды для локальных MCP-настроек. Он не записывает конфиг в агентов: агент или адаптер запрашивает нужный профиль.",
      items: [
        "GET /api/config?profile=<name>&client=<client> возвращает настройки.",
        "Параметр profile выбирает, какой набор серверов получит вызывающая сторона.",
        "Ответ содержит mcpServers, а также запрошенные profile и client.",
      ],
    },
    {
      title: "Что хранит MCP Hub",
      body: "Каталог хранит определения MCP-серверов и метаданные для их обслуживания.",
      items: [
        "registry.yaml хранит команды, URL, заголовки, переменные окружения, теги, описания и найденные навыки.",
        "profiles.yaml хранит именованные наборы доступа: default, content, dev или all.",
        "tool-snapshots.yaml хранит снимки названий навыков, чтобы сканирование видело изменения возможностей.",
      ],
    },
    {
      title: "Профили",
      body: "Профиль - это именованный набор MCP-серверов. Вызывающая сторона выбирает профиль явно, а агент не угадывает его из всех серверов.",
      items: [
        "GET /api/config?profile=content&client=codex вернет только включенные серверы из content.",
        "Синтетический профиль all возвращает каждый включенный сервер.",
        "Выключенные серверы остаются в реестре, но пропускаются в ответах с настройками и при сканировании.",
      ],
    },
    {
      title: "Операции",
      body: "UI обслуживает каталог, а endpoint настроек отдает runtime-конфиг вызывающим сторонам.",
      items: [
        "Импорт читает существующий конфиг клиента и объединяет серверы с локальным реестром.",
        "Сканирование подключается к stdio или remote HTTP серверам, вызывает tools/list и сохраняет читаемые названия и описания навыков.",
        "Получить настройки вызывает /api/config для активного профиля и выбранного клиента.",
      ],
    },
    {
      title: "State и Config",
      body: "MCP Hub отдает две разные поверхности: безопасное состояние для UI и чувствительный runtime-конфиг.",
      items: [
        "/api/state питает интерфейс и маскирует значения, похожие на токены.",
        "/api/config нужен агентам и сохраняет токены, заголовки и переменные окружения.",
        "Ответы /api/config стоит считать чувствительными, если в них есть токены.",
      ],
    },
    {
      title: "Версионность",
      body: "Бейдж в шапке показывает версию приложения, версию схемы каталога и версию состояния UI, которые отдает backend.",
      items: [
        "Версия приложения относится к релизу пакета MCP Hub.",
        "Версия схемы каталога относится к формату registry/profiles файлов.",
        "Версия состояния UI относится к контракту /api/state, который читает frontend.",
      ],
    },
  ],
};

activeLocale = getInitialLocale();

const el = {
  versionBadge: document.querySelector("#versionBadge"),
  configPath: document.querySelector("#configPath"),
  localeSelect: document.querySelector("#localeSelect"),
  profileFilter: document.querySelector("#profileFilter"),
  serversTable: document.querySelector("#serversTable"),
  activeTitle: document.querySelector("#activeTitle"),
  summaryLine: document.querySelector("#summaryLine"),
  searchBox: document.querySelector("#searchBox"),
  progressStats: document.querySelector("#progressStats"),
  doneList: document.querySelector("#doneList"),
  remainingList: document.querySelector("#remainingList"),
  activityFeed: document.querySelector("#activityFeed"),
  refreshBtn: document.querySelector("#refreshBtn"),
  sideAddOpenBtn: document.querySelector("#sideAddOpenBtn"),
  sideImportOpenBtn: document.querySelector("#sideImportOpenBtn"),
  sideScanOpenBtn: document.querySelector("#sideScanOpenBtn"),
  docsOpenBtn: document.querySelector("#docsOpenBtn"),
  docsDialog: document.querySelector("#docsDialog"),
  docsBody: document.querySelector("#docsBody"),
  addDialog: document.querySelector("#addDialog"),
  addName: document.querySelector("#addName"),
  addUrl: document.querySelector("#addUrl"),
  addToken: document.querySelector("#addToken"),
  addBtn: document.querySelector("#addBtn"),
  importDialog: document.querySelector("#importDialog"),
  importClient: document.querySelector("#importClient"),
  importPath: document.querySelector("#importPath"),
  importBtn: document.querySelector("#importBtn"),
  scanDialog: document.querySelector("#scanDialog"),
  scanProfileSelect: document.querySelector("#scanProfileSelect"),
  scanRunBtn: document.querySelector("#scanRunBtn"),
  scanResult: document.querySelector("#scanResult"),
  configClient: document.querySelector("#configClient"),
  configBtn: document.querySelector("#configBtn"),
  configDialog: document.querySelector("#configDialog"),
  configOutput: document.querySelector("#configOutput"),
  unitDialog: document.querySelector("#unitDialog"),
  unitTitle: document.querySelector("#unitTitle"),
  unitSubtitle: document.querySelector("#unitSubtitle"),
  unitCardBody: document.querySelector("#unitCardBody"),
  unitDeleteBtn: document.querySelector("#unitDeleteBtn"),
  toast: document.querySelector("#toast"),
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }
  return data;
}

async function loadState() {
  state = await api("/api/state");
  if (!availableLocales().includes(activeLocale)) {
    activeLocale = state.app?.defaultLocale || "en";
  }
  if (!profileNames().includes(activeProfile)) {
    activeProfile = profileNames()[0] || "all";
  }
  if (!selectedServer && state.servers.length) {
    selectedServer = state.servers[0].name;
  }
  render();
}

function getInitialLocale() {
  const saved = safeLocalStorageGet("mcpHubLocale");
  if (saved && I18N[saved]) return saved;
  return "ru";
}

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return "";
  }
}

function safeLocalStorageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}

function availableLocales() {
  const locales = state?.app?.locales || Object.keys(I18N);
  return locales.filter((locale) => I18N[locale]);
}

function t(key, params = {}) {
  const dict = I18N[activeLocale] || I18N.en;
  const template = dict[key] || I18N.en[key] || key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? ""));
}

function profileNames() {
  const names = state ? state.profiles.map((profile) => profile.name) : [];
  if (state && state.servers.length && !names.includes("all")) {
    names.push("all");
  }
  return names;
}

function serversForProfile(name) {
  if (name === "all") {
    return state.servers;
  }
  const profile = state.profiles.find((item) => item.name === name);
  const names = new Set(profile ? profile.servers : []);
  return state.servers.filter((server) => names.has(server.name));
}

function render() {
  renderLocaleSelect();
  applyStaticI18n();
  renderVersionBadge();
  el.configPath.textContent = state.configDir;
  renderClientSelects();
  renderProfileFilter();
  renderScanProfileSelect();
  renderProgressSummary();
  renderServers();
  renderActivityFeed();
  renderDocs();
}

function renderLocaleSelect() {
  const locales = availableLocales();
  const currentOptions = Array.from(el.localeSelect.options).map((option) => option.value);
  if (currentOptions.join("\n") !== locales.join("\n")) {
    el.localeSelect.innerHTML = "";
    for (const locale of locales) {
      const option = document.createElement("option");
      option.value = locale;
      el.localeSelect.append(option);
    }
  }
  for (const option of el.localeSelect.options) {
    option.textContent = t(`locale_${option.value}`);
  }
  el.localeSelect.value = activeLocale;
}

function applyStaticI18n() {
  document.documentElement.lang = activeLocale;
  document.title = t("documentTitle");
  for (const node of document.querySelectorAll("[data-i18n]")) {
    node.textContent = t(node.dataset.i18n);
  }
  for (const node of document.querySelectorAll("[data-i18n-title]")) {
    node.title = t(node.dataset.i18nTitle);
  }
  for (const node of document.querySelectorAll("[data-i18n-placeholder]")) {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  }
}

function renderVersionBadge() {
  const app = state.app || {};
  el.versionBadge.textContent = t("versionBadge", {
    version: app.version || "0.0.0",
    catalog: app.catalogSchemaVersion || 1,
    state: app.uiStateVersion || 1,
  });
}

function renderClientSelects() {
  for (const select of [el.importClient, el.configClient]) {
    if (select.options.length) continue;
    for (const client of state.clients) {
      const option = document.createElement("option");
      option.value = client;
      option.textContent = client;
      select.append(option);
    }
  }
}

function renderProgressSummary() {
  const metrics = progressMetrics();
  const statItems = [
    ["statsServers", metrics.serverCount],
    ["enabled", metrics.enabledCount],
    ["statsProfiles", metrics.profileCount],
    ["statsAssigned", metrics.assignedCount],
    ["statsScanned", metrics.scannedCount],
    ["statsActions", metrics.actionCount],
    ["statsEvents", metrics.eventCount],
  ];
  el.progressStats.innerHTML = statItems.map(([label, value]) => `
    <div class="progress-stat">
      <div class="progress-stat-value">${escapeHtml(value)}</div>
      <div class="progress-stat-label">${escapeHtml(t(label))}</div>
    </div>
  `).join("");
  el.doneList.innerHTML = renderProgressList(doneItems(metrics), "done");
  el.remainingList.innerHTML = renderProgressList(remainingItems(metrics), "remaining");
}

function progressMetrics() {
  const servers = state.servers || [];
  const profileNames = (state.profiles || []).map((profile) => profile.name);
  const configuredProfiles = (state.profiles || []).filter((profile) => profile.name !== "all");
  return {
    serverCount: servers.length,
    enabledCount: servers.filter((server) => server.enabled).length,
    disabledCount: servers.filter((server) => !server.enabled).length,
    profileCount: configuredProfiles.length,
    assignedCount: servers.filter((server) => (server.profiles || []).length).length,
    unassignedCount: servers.filter((server) => !(server.profiles || []).length).length,
    scannedCount: servers.filter((server) => (server.toolCount || 0) > 0).length,
    unscannedCount: servers.filter((server) => (server.toolCount || 0) === 0 && server.transport === "stdio").length,
    actionCount: servers.reduce((total, server) => total + (server.toolCount || 0), 0),
    eventCount: (state.events || []).length,
    configClientCount: (state.clients || []).length,
    hasDefaultProfile: profileNames.includes("default"),
  };
}

function doneItems(metrics) {
  const items = [];
  if (metrics.serverCount) items.push(t("taskCatalogReady", { count: metrics.serverCount }));
  if (metrics.profileCount) items.push(t("taskProfilesReady", { count: metrics.profileCount }));
  if (metrics.scannedCount) items.push(t("taskActionsScanned", { count: metrics.scannedCount }));
  if (metrics.configClientCount) items.push(t("taskConfigReady", { count: metrics.configClientCount }));
  items.push(t("taskEventsReady"));
  return items;
}

function remainingItems(metrics) {
  const items = [];
  if (!metrics.serverCount) items.push(t("taskAddServers"));
  if (metrics.unassignedCount) items.push(t("taskUnassigned", { count: metrics.unassignedCount }));
  if (metrics.unscannedCount) items.push(t("taskScanMissing", { count: metrics.unscannedCount }));
  if (metrics.disabledCount) items.push(t("taskReviewDisabled", { count: metrics.disabledCount }));
  if (!metrics.eventCount) items.push(t("taskRunFirstEvent"));
  if (!items.length) items.push(t("taskNoRemaining"));
  return items;
}

function renderProgressList(items, tone) {
  return items.map((item) => `
    <div class="progress-item ${tone}">
      <span class="progress-marker"></span>
      <span>${escapeHtml(item)}</span>
    </div>
  `).join("");
}

function renderProfileFilter() {
  const names = profileNames();
  const currentOptions = Array.from(el.profileFilter.options).map((option) => option.value);
  if (currentOptions.join("\n") !== names.join("\n")) {
    el.profileFilter.innerHTML = "";
    for (const name of names) {
      const option = document.createElement("option");
      option.value = name;
      el.profileFilter.append(option);
    }
  }
  for (const option of el.profileFilter.options) {
    option.textContent = `${profileDisplayName(option.value)} (${serversForProfile(option.value).length})`;
  }
  el.profileFilter.value = activeProfile;
}

function renderScanProfileSelect() {
  const names = profileNames();
  const currentOptions = Array.from(el.scanProfileSelect.options).map((option) => option.value);
  if (currentOptions.join("\n") !== names.join("\n")) {
    el.scanProfileSelect.innerHTML = "";
    for (const name of names) {
      const option = document.createElement("option");
      option.value = name;
      el.scanProfileSelect.append(option);
    }
  }
  for (const option of el.scanProfileSelect.options) {
    option.textContent = `${profileDisplayName(option.value)} (${serversForProfile(option.value).length})`;
  }
  el.scanProfileSelect.value = names.includes(activeProfile) ? activeProfile : "all";
}

function renderServers() {
  const query = el.searchBox.value.trim().toLowerCase();
  const servers = serversForProfile(activeProfile).filter((server) => {
    const toolNames = (server.tools || []).map((tool) => tool.name).join(" ");
    const haystack = `${server.name} ${server.transport} ${server.target} ${server.profiles.join(" ")} ${toolNames}`.toLowerCase();
    return haystack.includes(query);
  });
  el.activeTitle.textContent = t("mcpServers");
  const enabled = servers.filter((server) => server.enabled).length;
  const profileText = activeProfile === "all" ? t("allProfiles") : t("profileName", { profile: activeProfile });
  el.summaryLine.textContent = t("serverSummary", { servers: servers.length, enabled, profile: profileText });
  el.serversTable.innerHTML = "";
  for (const server of servers) {
    const row = document.createElement("tr");
    row.className = server.name === selectedServer ? "selected" : "";
    row.innerHTML = `
      <td><div class="server-name">${escapeHtml(server.name)}</div></td>
      <td>${escapeHtml(server.transport)}</td>
      <td><div class="target mono" title="${escapeAttr(server.target)}">${escapeHtml(server.target)}</div></td>
      <td>${server.toolCount || 0}</td>
      <td>${renderPills(server.profiles)}</td>
      <td><span class="${server.enabled ? "state-on" : "state-off"}">${t(server.enabled ? "enabledStatus" : "disabledStatus")}</span></td>
      <td>
        <div class="row-actions">
          <button class="open-button">${t("open")}</button>
          <button class="toggle-button">${t(server.enabled ? "disable" : "enable")}</button>
        </div>
      </td>
    `;
    row.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      selectedServer = server.name;
      render();
    });
    row.querySelector(".toggle-button").addEventListener("click", async () => {
      await api("/api/server", {
        method: "POST",
        body: JSON.stringify({ name: server.name, enabled: !server.enabled }),
      });
      showToast(t(server.enabled ? "serverDisabled" : "serverEnabled", { server: server.name }));
      await loadState();
    });
    row.querySelector(".open-button").addEventListener("click", () => {
      selectedServer = server.name;
      render();
      openUnitCard(server.name);
    });
    el.serversTable.append(row);
  }
}

function renderPills(values) {
  if (!values.length) return `<span class="subtle">-</span>`;
  return `<div class="pill-list">${values.map((value) => `<span class="pill">${escapeHtml(value)}</span>`).join("")}</div>`;
}

function renderActivityFeed() {
  const events = state.events || [];
  if (!events.length) {
    el.activityFeed.innerHTML = `<div class="empty-actions">${escapeHtml(t("noEvents"))}</div>`;
    return;
  }
  el.activityFeed.innerHTML = events.map((event) => `
    <article class="activity-item">
      <div class="activity-dot ${escapeAttr(event.kind || "event")}"></div>
      <div class="activity-main">
        <div class="activity-title">${escapeHtml(eventTitle(event))}</div>
        <div class="activity-meta">${escapeHtml(eventMeta(event))}</div>
      </div>
    </article>
  `).join("");
}

function eventTitle(event) {
  const params = {
    server: event.server || "-",
    client: event.client || "-",
    profile: event.profile || "-",
    count: event.count ?? event.serverCount ?? event.scanned ?? 0,
  };
  const titleByKind = {
    config_request: "eventConfigRequest",
    export: "eventConfigRequest",
    import: "eventImport",
    profile_update: "eventProfileUpdate",
    scan: "eventScan",
    server_create: "eventServerCreate",
    server_delete: "eventServerDelete",
    server_disable: "eventServerDisable",
    server_enable: "eventServerEnable",
  };
  return t(titleByKind[event.kind] || "activityFeed", params);
}

function eventMeta(event) {
  const parts = [formatEventTime(event.ts)];
  if (event.kind === "scan") {
    parts.push(t("scanStats", {
      changed: event.changed || 0,
      broken: event.broken || 0,
      skipped: event.skipped || 0,
    }));
    if (event.server) {
      parts.push(`${t("serverSection")}: ${event.server}`);
    }
  }
  if (event.profile && event.kind !== "profile_update") {
    parts.push(`${t("profile")}: ${event.profile}`);
  }
  if (Array.isArray(event.servers) && event.servers.length) {
    parts.push(event.servers.slice(0, 4).join(", ") + (event.servers.length > 4 ? ", ..." : ""));
  }
  return parts.filter(Boolean).join(" · ");
}

function formatEventTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(activeLocale === "ru" ? "ru-RU" : "en-US", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderDocs() {
  const sections = DOCS[activeLocale] || DOCS.en;
  el.docsBody.innerHTML = sections.map((section) => `
    <article class="docs-section">
      <h3>${escapeHtml(section.title)}</h3>
      <p>${escapeHtml(section.body)}</p>
      <ul>
        ${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
      </ul>
    </article>
  `).join("");
}

function openUnitCard(name = selectedServer) {
  const server = state.servers.find((item) => item.name === name);
  if (!server) return;
  selectedServer = server.name;
  renderUnitCard(server);
  el.unitDialog.showModal();
}

function renderUnitCard(server) {
  el.unitTitle.textContent = server.name;
  el.unitSubtitle.textContent = t("unitSubtitle", {
    transport: server.transport,
    actions: server.toolCount || 0,
    status: t(server.enabled ? "enabledStatus" : "disabledStatus"),
  });
  const fields = [
    ["target", server.target || "-"],
    ["profiles", server.profiles.join(", ") || "-"],
    ["tags", server.tags.join(", ") || "-"],
    ["env", formatMap(server.env, server.envKeys)],
    ["headers", formatMap(server.headers, server.headerKeys)],
    ["description", server.description || "-"],
  ];
  if (server.command && server.command !== server.target) {
    fields.splice(1, 0, ["command", server.command]);
  }
  if (server.url && server.url !== server.target) {
    fields.splice(1, 0, ["url", server.url]);
  }
  const wideLabels = new Set(["target", "command", "url", "description"]);
  el.unitCardBody.innerHTML = `
    <section class="unit-section compact-section">
      <h3>${escapeHtml(t("serverSection"))}</h3>
      <div class="unit-info-grid">
        ${fields.map(([label, value]) => `
          <div class="unit-info-row ${wideLabels.has(label) ? "wide" : ""}">
            <div class="unit-info-label">${escapeHtml(t(label))}</div>
            <div class="unit-info-value mono">${escapeHtml(value)}</div>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="unit-section">
      <h3>${escapeHtml(t("actions"))}</h3>
      ${renderUnitTools(server.tools || [])}
    </section>
  `;
}

function renderUnitTools(tools) {
  if (!tools.length) {
    return `<div class="empty-actions">${escapeHtml(t("noActionsScanned"))}</div>`;
  }
  return `
    <div class="unit-tool-list">
      ${tools.map((tool) => `
        <article class="unit-tool">
          <div class="tool-name mono">${escapeHtml(tool.name)}</div>
          <div class="tool-description">${escapeHtml(tool.description || t("noDescription"))}</div>
        </article>
      `).join("")}
    </div>
  `;
}

function formatMap(values, fallbackKeys = []) {
  if (values && Object.keys(values).length) {
    return Object.entries(values)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("\n");
  }
  return fallbackKeys && fallbackKeys.length ? fallbackKeys.join(", ") : "-";
}

async function importServers() {
  const payload = {
    client: el.importClient.value,
  };
  const path = el.importPath.value.trim();
  if (path) payload.path = path;
  const result = await api("/api/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  el.importDialog.close();
  showToast(t("importedServers", { count: result.imported.length }));
  await loadState();
}

async function addServer() {
  const url = normalizeRemoteUrl(el.addUrl.value);
  const token = authorizationHeader(el.addToken.value);
  const payload = {
    action: "create",
    name: el.addName.value.trim() || serverNameFromUrl(url),
    transport: "http",
    url,
    headers: { Authorization: token },
    profile: "default",
    tags: ["remote"],
  };
  const result = await api("/api/server", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  selectedServer = result.server;
  activeProfile = payload.profile || "all";
  clearAddForm();
  el.addDialog.close();
  showToast(t("serverAddedScanning", { server: result.server }));
  let scanResult;
  try {
    scanResult = await api("/api/scan", {
      method: "POST",
      body: JSON.stringify({ server: result.server }),
    });
  } catch (error) {
    await loadState();
    showToast(t("serverAddedScanFailed", { server: result.server, error: error.message }));
    return;
  }
  await loadState();
  const scanItem = scanResult.results[0] || {};
  if (scanItem.status === "ok") {
    showToast(t("serverAddedWithActions", { server: result.server, count: scanItem.toolCount || 0 }));
  } else {
    showToast(t("serverAddedScanFailed", {
      server: result.server,
      error: scanItem.error || scanItem.reason || t("noActionsScanned"),
    }));
  }
}

function clearAddForm() {
  el.addName.value = "";
  el.addUrl.value = "";
  el.addToken.value = "";
}

function normalizeRemoteUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(t("addressRequired"));
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (!["http:", "https:"].includes(url.protocol) || !url.hostname) {
      throw new Error();
    }
    return url.href;
  } catch {
    throw new Error(t("invalidAddress"));
  }
}

function authorizationHeader(value) {
  let token = value.trim();
  if (!token) throw new Error(t("tokenRequired"));
  token = token.replace(/^authorization\s*:\s*/i, "");
  return /^bearer\s+/i.test(token) ? token : `Bearer ${token}`;
}

function serverNameFromUrl(value) {
  const url = new URL(value);
  return url.hostname.replace(/^www\./i, "").toLowerCase();
}

async function deleteSelectedServer() {
  const server = state.servers.find((item) => item.name === selectedServer);
  if (!server) return;
  if (!confirm(t("deleteConfirm", { server: server.name }))) return;
  await api("/api/server", {
    method: "POST",
    body: JSON.stringify({ action: "delete", name: server.name }),
  });
  showToast(t("deleted", { server: server.name }));
  if (el.unitDialog.open) {
    el.unitDialog.close();
  }
  selectedServer = serversForProfile(activeProfile).find((item) => item.name !== server.name)?.name || null;
  await loadState();
}

async function requestProfileConfig() {
  const params = new URLSearchParams({
    client: el.configClient.value,
    profile: activeProfile,
  });
  const result = await api(`/api/config?${params.toString()}`);
  el.configOutput.textContent = JSON.stringify(result, null, 2);
  await loadState();
  el.configDialog.showModal();
}

async function scanProfile() {
  const profile = el.scanProfileSelect.value || activeProfile;
  el.scanResult.innerHTML = `<div class="empty-actions">${escapeHtml(t("scanning"))}</div>`;
  const result = await api("/api/scan", {
    method: "POST",
    body: JSON.stringify({ profile: profile === "all" ? null : profile }),
  });
  const broken = result.results.filter((item) => item.status === "broken").length;
  const changed = result.results.filter((item) => item.changed).length;
  renderScanResults(result.results);
  showToast(t("scanToast", { changed, broken }));
  await loadState();
}

function renderScanResults(results) {
  if (!results.length) {
    el.scanResult.innerHTML = `<div class="empty-actions">${escapeHtml(t("noServersScanned"))}</div>`;
    return;
  }
  el.scanResult.innerHTML = `
    <div class="scan-list">
      ${results.map((item) => `
        <div class="scan-item">
          <div>
            <div class="scan-server">${escapeHtml(item.server)}</div>
            <div class="subtle">${escapeHtml(scanResultSummary(item))}</div>
          </div>
          <span class="scan-status ${escapeAttr(item.status)}">${escapeHtml(item.status)}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function scanResultSummary(item) {
  if (item.status === "ok") {
    const marker = item.firstScan ? t("baseline") : item.changed ? t("changed") : t("unchanged");
    return t("scanOkSummary", { count: item.toolCount, marker });
  }
  return item.error || item.reason || "-";
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.add("visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => el.toast.classList.remove("visible"), 2600);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}

function profileDisplayName(name) {
  return name === "all" ? t("allProfileName") : name;
}

el.localeSelect.addEventListener("change", () => {
  activeLocale = el.localeSelect.value;
  safeLocalStorageSet("mcpHubLocale", activeLocale);
  render();
});
el.refreshBtn.addEventListener("click", () => loadState().then(() => showToast(t("refreshed"))).catch((error) => showToast(error.message)));
function openAddDialog() {
  el.addDialog.showModal();
  el.addName.focus();
}

function openImportDialog() {
  el.importDialog.showModal();
  el.importClient.focus();
}

function openScanDialog() {
  renderScanProfileSelect();
  el.scanResult.innerHTML = "";
  el.scanDialog.showModal();
  el.scanProfileSelect.focus();
}

function openDocsDialog() {
  renderDocs();
  el.docsDialog.showModal();
}

el.sideAddOpenBtn.addEventListener("click", openAddDialog);
el.sideImportOpenBtn.addEventListener("click", openImportDialog);
el.sideScanOpenBtn.addEventListener("click", openScanDialog);
el.docsOpenBtn.addEventListener("click", openDocsDialog);
el.addBtn.addEventListener("click", () => addServer().catch((error) => showToast(error.message)));
el.importBtn.addEventListener("click", () => importServers().catch((error) => showToast(error.message)));
el.configBtn.addEventListener("click", () => requestProfileConfig().catch((error) => showToast(error.message)));
el.scanRunBtn.addEventListener("click", () => scanProfile().catch((error) => showToast(error.message)));
el.unitDeleteBtn.addEventListener("click", () => deleteSelectedServer().catch((error) => showToast(error.message)));
el.profileFilter.addEventListener("change", () => {
  activeProfile = el.profileFilter.value;
  selectedServer = serversForProfile(activeProfile)[0]?.name || null;
  render();
});
el.searchBox.addEventListener("input", renderServers);

loadState().catch((error) => showToast(error.message));
