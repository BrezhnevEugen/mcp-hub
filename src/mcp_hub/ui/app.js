let state = null;
let activeProfile = "all";
let selectedServer = null;
let activeLocale = "en";

const I18N = {
  en: {
    add: "Add",
    actions: "Actions",
    allProfiles: "all profiles",
    allProfileName: "all",
    availableActions: "Available Actions",
    baseline: "baseline",
    catalog: "Catalog",
    changed: "changed",
    client: "Client",
    close: "Close",
    command: "Command",
    delete: "Delete",
    deleteConfirm: "Delete {server} from MCP Hub?",
    deleted: "Deleted {server}",
    description: "Description",
    details: "Details",
    disabledStatus: "disabled",
    disable: "Disable",
    documentTitle: "MCP Hub",
    enabled: "Enabled",
    enabledStatus: "enabled",
    enable: "Enable",
    env: "Environment",
    export: "Export",
    headers: "Headers",
    importedServers: "Imported {count} server(s)",
    import: "Import",
    localeLabel: "Locale",
    locale_en: "English",
    locale_ru: "Russian",
    manualAdd: "Manual Add",
    mcpServers: "MCP Servers",
    name: "Name",
    noActionsScanned: "No actions scanned yet",
    noDescription: "No description",
    noServersScanned: "No servers scanned",
    open: "Open",
    openCard: "Open Card",
    operations: "Operations",
    optional: "optional",
    path: "Path",
    profile: "Profile",
    profileName: "profile {profile}",
    profiles: "Profiles",
    refreshed: "Refreshed",
    remoteHttp: "remote http",
    refresh: "Refresh",
    runScan: "Run Scan",
    scan: "Scan",
    scanToast: "Scan: {changed} changed, {broken} broken",
    scanOkSummary: "{count} action(s), {marker}",
    scanning: "Scanning...",
    searchServers: "Search servers",
    serverAdded: "Added {server}",
    serverDisabled: "{server} disabled",
    serverEnabled: "{server} enabled",
    serverSection: "Server",
    serverSummary: "{servers} server(s), {enabled} enabled, {profile}",
    status: "Status",
    stdio: "Stdio",
    tags: "Tags",
    target: "Target",
    transport: "Transport",
    unchanged: "unchanged",
    unitSubtitle: "{transport} · {actions} action(s) · {status}",
    url: "URL",
    versionBadge: "v{version} · catalog v{catalog} · state v{state}",
  },
  ru: {
    add: "Добавить",
    actions: "Навыки",
    allProfiles: "все профили",
    allProfileName: "все",
    availableActions: "Доступные навыки",
    baseline: "база",
    catalog: "Каталог",
    changed: "изменено",
    client: "Клиент",
    close: "Закрыть",
    command: "Команда",
    delete: "Удалить",
    deleteConfirm: "Удалить {server} из MCP Hub?",
    deleted: "Удален {server}",
    description: "Описание",
    details: "Детали",
    disabledStatus: "выключен",
    disable: "Выключить",
    documentTitle: "MCP Hub",
    enabled: "Активные",
    enabledStatus: "включен",
    enable: "Включить",
    env: "Окружение",
    export: "Экспорт",
    headers: "Заголовки",
    importedServers: "Импортировано серверов: {count}",
    import: "Импорт",
    localeLabel: "Язык",
    locale_en: "English",
    locale_ru: "Русский",
    manualAdd: "Ручное добавление",
    mcpServers: "MCP-серверы",
    name: "Имя",
    noActionsScanned: "Навыки пока не просканированы",
    noDescription: "Нет описания",
    noServersScanned: "Нет просканированных серверов",
    open: "Открыть",
    openCard: "Открыть карточку",
    operations: "Операции",
    optional: "необязательно",
    path: "Путь",
    profile: "Профиль",
    profileName: "профиль {profile}",
    profiles: "Профили",
    refreshed: "Обновлено",
    remoteHttp: "remote http",
    refresh: "Обновить",
    runScan: "Запустить сканирование",
    scan: "Сканирование",
    scanToast: "Сканирование: изменено {changed}, ошибок {broken}",
    scanOkSummary: "{count} навык(ов), {marker}",
    scanning: "Сканирование...",
    searchServers: "Поиск серверов",
    serverAdded: "Добавлен {server}",
    serverDisabled: "{server} выключен",
    serverEnabled: "{server} включен",
    serverSection: "Сервер",
    serverSummary: "{servers} сервер(ов), включено {enabled}, {profile}",
    status: "Статус",
    stdio: "Stdio",
    tags: "Теги",
    target: "Цель",
    transport: "Транспорт",
    unchanged: "без изменений",
    unitSubtitle: "{transport} · {actions} навык(ов) · {status}",
    url: "URL",
    versionBadge: "v{version} · каталог v{catalog} · состояние v{state}",
  },
};

activeLocale = getInitialLocale();

const el = {
  versionBadge: document.querySelector("#versionBadge"),
  configPath: document.querySelector("#configPath"),
  localeSelect: document.querySelector("#localeSelect"),
  serverCount: document.querySelector("#serverCount"),
  enabledCount: document.querySelector("#enabledCount"),
  stdioCount: document.querySelector("#stdioCount"),
  remoteCount: document.querySelector("#remoteCount"),
  profileFilter: document.querySelector("#profileFilter"),
  serversTable: document.querySelector("#serversTable"),
  activeTitle: document.querySelector("#activeTitle"),
  summaryLine: document.querySelector("#summaryLine"),
  searchBox: document.querySelector("#searchBox"),
  detailsBody: document.querySelector("#detailsBody"),
  refreshBtn: document.querySelector("#refreshBtn"),
  sideAddOpenBtn: document.querySelector("#sideAddOpenBtn"),
  sideImportOpenBtn: document.querySelector("#sideImportOpenBtn"),
  sideScanOpenBtn: document.querySelector("#sideScanOpenBtn"),
  addDialog: document.querySelector("#addDialog"),
  addName: document.querySelector("#addName"),
  addTransport: document.querySelector("#addTransport"),
  addCommand: document.querySelector("#addCommand"),
  addUrl: document.querySelector("#addUrl"),
  addProfile: document.querySelector("#addProfile"),
  addTags: document.querySelector("#addTags"),
  addBtn: document.querySelector("#addBtn"),
  importDialog: document.querySelector("#importDialog"),
  importClient: document.querySelector("#importClient"),
  importPath: document.querySelector("#importPath"),
  importBtn: document.querySelector("#importBtn"),
  scanDialog: document.querySelector("#scanDialog"),
  scanProfileSelect: document.querySelector("#scanProfileSelect"),
  scanRunBtn: document.querySelector("#scanRunBtn"),
  scanResult: document.querySelector("#scanResult"),
  exportClient: document.querySelector("#exportClient"),
  exportBtn: document.querySelector("#exportBtn"),
  exportDialog: document.querySelector("#exportDialog"),
  exportOutput: document.querySelector("#exportOutput"),
  unitDialog: document.querySelector("#unitDialog"),
  unitTitle: document.querySelector("#unitTitle"),
  unitSubtitle: document.querySelector("#unitSubtitle"),
  unitCardBody: document.querySelector("#unitCardBody"),
  openUnitBtn: document.querySelector("#openUnitBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
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
  renderAddForm();
  renderCatalogStats();
  renderProfileFilter();
  renderScanProfileSelect();
  renderServers();
  renderDetails();
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

function renderAddForm() {
  const isRemote = el.addTransport.value === "http";
  el.addCommand.disabled = isRemote;
  el.addUrl.disabled = !isRemote;
}

function renderClientSelects() {
  for (const select of [el.importClient, el.exportClient]) {
    if (select.options.length) continue;
    for (const client of state.clients) {
      const option = document.createElement("option");
      option.value = client;
      option.textContent = client;
      select.append(option);
    }
  }
}

function renderCatalogStats() {
  const enabled = state.servers.filter((server) => server.enabled).length;
  const stdio = state.servers.filter((server) => server.transport === "stdio").length;
  const actions = state.servers.reduce((total, server) => total + (server.toolCount || 0), 0);
  el.serverCount.textContent = String(state.servers.length);
  el.enabledCount.textContent = String(enabled);
  el.stdioCount.textContent = String(stdio);
  el.remoteCount.textContent = String(actions);
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

function renderDetails() {
  const server = state.servers.find((item) => item.name === selectedServer);
  if (!server) {
    el.detailsBody.innerHTML = "";
    el.deleteBtn.disabled = true;
    el.openUnitBtn.disabled = true;
    return;
  }
  el.deleteBtn.disabled = false;
  el.openUnitBtn.disabled = false;
  const items = [
    ["name", server.name],
    ["transport", server.transport],
    ["target", server.target],
    ["profiles", server.profiles.join(", ") || "-"],
    ["tags", server.tags.join(", ") || "-"],
    ["actions", String(server.toolCount || 0)],
    ["env", formatMap(server.env, server.envKeys)],
    ["headers", formatMap(server.headers, server.headerKeys)],
    ["description", server.description || "-"],
  ];
  const toolList = renderToolList(server.tools || []);
  el.detailsBody.innerHTML = items.map(([label, value]) => `
    <div class="detail-item">
      <div class="detail-label">${escapeHtml(t(label))}</div>
      <div class="detail-value mono">${escapeHtml(value)}</div>
    </div>
  `).join("") + `
    <div class="detail-item full-span">
      <div class="detail-label">${escapeHtml(t("availableActions"))}</div>
      ${toolList}
    </div>
  `;
}

function renderPills(values) {
  if (!values.length) return `<span class="subtle">-</span>`;
  return `<div class="pill-list">${values.map((value) => `<span class="pill">${escapeHtml(value)}</span>`).join("")}</div>`;
}

function renderToolList(tools) {
  if (!tools.length) {
    return `<div class="empty-actions">${escapeHtml(t("noActionsScanned"))}</div>`;
  }
  return `
    <div class="tool-list">
      ${tools.map((tool) => `
        <div class="tool-item">
          <div class="tool-name mono">${escapeHtml(tool.name)}</div>
          <div class="tool-description">${escapeHtml(tool.description || t("noDescription"))}</div>
        </div>
      `).join("")}
    </div>
  `;
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
  const transport = el.addTransport.value;
  const payload = {
    action: "create",
    name: el.addName.value.trim(),
    transport,
    profile: el.addProfile.value.trim(),
    tags: el.addTags.value.split(",").map((item) => item.trim()).filter(Boolean),
  };
  if (transport === "http") {
    payload.url = el.addUrl.value.trim();
  } else {
    payload.command = el.addCommand.value.trim();
  }
  const result = await api("/api/server", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  selectedServer = result.server;
  activeProfile = payload.profile || "all";
  clearAddForm();
  el.addDialog.close();
  showToast(t("serverAdded", { server: result.server }));
  await loadState();
}

function clearAddForm() {
  el.addName.value = "";
  el.addCommand.value = "";
  el.addUrl.value = "";
  el.addTags.value = "";
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
  selectedServer = serversForProfile(activeProfile).find((item) => item.name !== server.name)?.name || null;
  await loadState();
}

async function exportProfile() {
  const params = new URLSearchParams({
    client: el.exportClient.value,
    profile: activeProfile,
  });
  const result = await api(`/api/export?${params.toString()}`);
  el.exportOutput.textContent = JSON.stringify(result, null, 2);
  el.exportDialog.showModal();
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

el.sideAddOpenBtn.addEventListener("click", openAddDialog);
el.sideImportOpenBtn.addEventListener("click", openImportDialog);
el.sideScanOpenBtn.addEventListener("click", openScanDialog);
el.addTransport.addEventListener("change", renderAddForm);
el.addBtn.addEventListener("click", () => addServer().catch((error) => showToast(error.message)));
el.importBtn.addEventListener("click", () => importServers().catch((error) => showToast(error.message)));
el.exportBtn.addEventListener("click", () => exportProfile().catch((error) => showToast(error.message)));
el.scanRunBtn.addEventListener("click", () => scanProfile().catch((error) => showToast(error.message)));
el.openUnitBtn.addEventListener("click", () => openUnitCard());
el.deleteBtn.addEventListener("click", () => deleteSelectedServer().catch((error) => showToast(error.message)));
el.profileFilter.addEventListener("change", () => {
  activeProfile = el.profileFilter.value;
  selectedServer = serversForProfile(activeProfile)[0]?.name || null;
  render();
});
el.searchBox.addEventListener("input", renderServers);

loadState().catch((error) => showToast(error.message));
