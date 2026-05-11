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
  addOpenBtn: document.querySelector("#addOpenBtn"),
  scanBtn: document.querySelector("#scanBtn"),
  addPanel: document.querySelector("#addPanel"),
  addName: document.querySelector("#addName"),
  addTransport: document.querySelector("#addTransport"),
  addCommand: document.querySelector("#addCommand"),
  addUrl: document.querySelector("#addUrl"),
  addProfile: document.querySelector("#addProfile"),
  addTags: document.querySelector("#addTags"),
  addBtn: document.querySelector("#addBtn"),
  importClient: document.querySelector("#importClient"),
  importPath: document.querySelector("#importPath"),
  importBtn: document.querySelector("#importBtn"),
  exportClient: document.querySelector("#exportClient"),
  exportBtn: document.querySelector("#exportBtn"),
  exportDialog: document.querySelector("#exportDialog"),
  exportOutput: document.querySelector("#exportOutput"),
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
  const remote = state.servers.filter((server) => server.transport !== "stdio").length;
  el.serverCount.textContent = String(state.servers.length);
  el.enabledCount.textContent = String(enabled);
  el.stdioCount.textContent = String(stdio);
  el.remoteCount.textContent = String(remote);
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

function renderServers() {
  const query = el.searchBox.value.trim().toLowerCase();
  const servers = serversForProfile(activeProfile).filter((server) => {
    const haystack = `${server.name} ${server.transport} ${server.target} ${server.profiles.join(" ")}`.toLowerCase();
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
      <td>${renderPills(server.profiles)}</td>
      <td><span class="${server.enabled ? "state-on" : "state-off"}">${server.enabled ? "enabled" : "disabled"}</span></td>
      <td><button class="toggle-button">${server.enabled ? "Disable" : "Enable"}</button></td>
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
    el.serversTable.append(row);
  }
}

function renderDetails() {
  const server = state.servers.find((item) => item.name === selectedServer);
  if (!server) {
    el.detailsBody.innerHTML = "";
    el.deleteBtn.disabled = true;
    return;
  }
  el.deleteBtn.disabled = false;
  const items = [
    ["Name", server.name],
    ["Transport", server.transport],
    ["Target", server.target],
    ["Profiles", server.profiles.join(", ") || "-"],
    ["Tags", server.tags.join(", ") || "-"],
    ["Env", server.envKeys.join(", ") || "-"],
    ["Headers", server.headerKeys.join(", ") || "-"],
    ["Description", server.description || "-"],
  ];
  el.detailsBody.innerHTML = items.map(([label, value]) => `
    <div class="detail-item">
      <div class="detail-label">${escapeHtml(label)}</div>
      <div class="detail-value mono">${escapeHtml(value)}</div>
    </div>
  `).join("");
}

function renderPills(values) {
  if (!values.length) return `<span class="subtle">-</span>`;
  return `<div class="pill-list">${values.map((value) => `<span class="pill">${escapeHtml(value)}</span>`).join("")}</div>`;
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
  showToast(`Synced ${result.imported.length} server(s)`);
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
  const result = await api("/api/scan", {
    method: "POST",
    body: JSON.stringify({ profile: activeProfile === "all" ? null : activeProfile }),
  });
  const broken = result.results.filter((item) => item.status === "broken").length;
  const changed = result.results.filter((item) => item.changed).length;
  showToast(`Scan: ${changed} changed, ${broken} broken`);
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
el.addOpenBtn.addEventListener("click", () => {
  el.addPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  el.addName.focus();
});
el.addTransport.addEventListener("change", renderAddForm);
el.addBtn.addEventListener("click", () => addServer().catch((error) => showToast(error.message)));
el.importBtn.addEventListener("click", () => importServers().catch((error) => showToast(error.message)));
el.exportBtn.addEventListener("click", () => exportProfile().catch((error) => showToast(error.message)));
el.scanBtn.addEventListener("click", () => scanProfile().catch((error) => showToast(error.message)));
el.deleteBtn.addEventListener("click", () => deleteSelectedServer().catch((error) => showToast(error.message)));
el.profileFilter.addEventListener("change", () => {
  activeProfile = el.profileFilter.value;
  selectedServer = serversForProfile(activeProfile)[0]?.name || null;
  render();
});
el.searchBox.addEventListener("input", renderServers);

loadState().catch((error) => showToast(error.message));
