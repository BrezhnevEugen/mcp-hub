let state = null;
let activeProfile = "all";
let selectedServer = null;

const el = {
  configPath: document.querySelector("#configPath"),
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
  if (!profileNames().includes(activeProfile)) {
    activeProfile = profileNames()[0] || "all";
  }
  if (!selectedServer && state.servers.length) {
    selectedServer = state.servers[0].name;
  }
  render();
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
  el.configPath.textContent = state.configDir;
  renderClientSelects();
  renderAddForm();
  renderCatalogStats();
  renderProfileFilter();
  renderScanProfileSelect();
  renderServers();
  renderDetails();
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
      option.textContent = `${name} (${serversForProfile(name).length})`;
      el.profileFilter.append(option);
    }
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
      option.textContent = `${name} (${serversForProfile(name).length})`;
      el.scanProfileSelect.append(option);
    }
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
  el.activeTitle.textContent = "MCP Servers";
  const enabled = servers.filter((server) => server.enabled).length;
  const profileText = activeProfile === "all" ? "all profiles" : `profile ${activeProfile}`;
  el.summaryLine.textContent = `${servers.length} server(s), ${enabled} enabled, ${profileText}`;
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
      <td><span class="${server.enabled ? "state-on" : "state-off"}">${server.enabled ? "enabled" : "disabled"}</span></td>
      <td>
        <div class="row-actions">
          <button class="open-button">Open</button>
          <button class="toggle-button">${server.enabled ? "Disable" : "Enable"}</button>
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
      showToast(`${server.name} ${server.enabled ? "disabled" : "enabled"}`);
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
    ["Name", server.name],
    ["Transport", server.transport],
    ["Target", server.target],
    ["Profiles", server.profiles.join(", ") || "-"],
    ["Tags", server.tags.join(", ") || "-"],
    ["Actions", String(server.toolCount || 0)],
    ["Env", formatMap(server.env, server.envKeys)],
    ["Headers", formatMap(server.headers, server.headerKeys)],
    ["Description", server.description || "-"],
  ];
  const toolList = renderToolList(server.tools || []);
  el.detailsBody.innerHTML = items.map(([label, value]) => `
    <div class="detail-item">
      <div class="detail-label">${escapeHtml(label)}</div>
      <div class="detail-value mono">${escapeHtml(value)}</div>
    </div>
  `).join("") + `
    <div class="detail-item full-span">
      <div class="detail-label">Available Actions</div>
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
    return `<div class="empty-actions">No actions scanned yet</div>`;
  }
  return `
    <div class="tool-list">
      ${tools.map((tool) => `
        <div class="tool-item">
          <div class="tool-name mono">${escapeHtml(tool.name)}</div>
          <div class="tool-description">${escapeHtml(tool.description || "No description")}</div>
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
  el.unitSubtitle.textContent = `${server.transport} · ${server.toolCount || 0} action(s) · ${server.enabled ? "enabled" : "disabled"}`;
  const fields = [
    ["Target", server.target || "-"],
    ["Profiles", server.profiles.join(", ") || "-"],
    ["Tags", server.tags.join(", ") || "-"],
    ["Env", formatMap(server.env, server.envKeys)],
    ["Headers", formatMap(server.headers, server.headerKeys)],
    ["Description", server.description || "-"],
  ];
  if (server.command && server.command !== server.target) {
    fields.splice(1, 0, ["Command", server.command]);
  }
  if (server.url && server.url !== server.target) {
    fields.splice(1, 0, ["URL", server.url]);
  }
  const wideLabels = new Set(["Target", "Command", "URL", "Description"]);
  el.unitCardBody.innerHTML = `
    <section class="unit-section compact-section">
      <h3>Server</h3>
      <div class="unit-info-grid">
        ${fields.map(([label, value]) => `
          <div class="unit-info-row ${wideLabels.has(label) ? "wide" : ""}">
            <div class="unit-info-label">${escapeHtml(label)}</div>
            <div class="unit-info-value mono">${escapeHtml(value)}</div>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="unit-section">
      <h3>Actions</h3>
      ${renderUnitTools(server.tools || [])}
    </section>
  `;
}

function renderUnitTools(tools) {
  if (!tools.length) {
    return `<div class="empty-actions">No actions scanned yet</div>`;
  }
  return `
    <div class="unit-tool-list">
      ${tools.map((tool) => `
        <article class="unit-tool">
          <div class="tool-name mono">${escapeHtml(tool.name)}</div>
          <div class="tool-description">${escapeHtml(tool.description || "No description")}</div>
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
  showToast(`Imported ${result.imported.length} server(s)`);
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
  showToast(`Added ${result.server}`);
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
  if (!confirm(`Delete ${server.name} from MCP Hub?`)) return;
  await api("/api/server", {
    method: "POST",
    body: JSON.stringify({ action: "delete", name: server.name }),
  });
  showToast(`Deleted ${server.name}`);
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
  el.scanResult.innerHTML = `<div class="empty-actions">Scanning...</div>`;
  const result = await api("/api/scan", {
    method: "POST",
    body: JSON.stringify({ profile: profile === "all" ? null : profile }),
  });
  const broken = result.results.filter((item) => item.status === "broken").length;
  const changed = result.results.filter((item) => item.changed).length;
  renderScanResults(result.results);
  showToast(`Scan: ${changed} changed, ${broken} broken`);
  await loadState();
}

function renderScanResults(results) {
  if (!results.length) {
    el.scanResult.innerHTML = `<div class="empty-actions">No servers scanned</div>`;
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
    const marker = item.firstScan ? "baseline" : item.changed ? "changed" : "unchanged";
    return `${item.toolCount} action(s), ${marker}`;
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

el.refreshBtn.addEventListener("click", () => loadState().then(() => showToast("Refreshed")).catch((error) => showToast(error.message)));
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
