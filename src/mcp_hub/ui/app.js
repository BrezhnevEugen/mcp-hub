let state = null;
let activeProfile = "all";
let selectedServer = null;

const el = {
  configPath: document.querySelector("#configPath"),
  profilesList: document.querySelector("#profilesList"),
  serversTable: document.querySelector("#serversTable"),
  activeTitle: document.querySelector("#activeTitle"),
  summaryLine: document.querySelector("#summaryLine"),
  searchBox: document.querySelector("#searchBox"),
  detailsBody: document.querySelector("#detailsBody"),
  refreshBtn: document.querySelector("#refreshBtn"),
  scanBtn: document.querySelector("#scanBtn"),
  importClient: document.querySelector("#importClient"),
  importProfile: document.querySelector("#importProfile"),
  importPath: document.querySelector("#importPath"),
  importBtn: document.querySelector("#importBtn"),
  exportClient: document.querySelector("#exportClient"),
  exportBtn: document.querySelector("#exportBtn"),
  exportDialog: document.querySelector("#exportDialog"),
  exportOutput: document.querySelector("#exportOutput"),
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
  renderProfiles();
  renderServers();
  renderDetails();
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

function renderProfiles() {
  el.profilesList.innerHTML = "";
  for (const name of profileNames()) {
    const button = document.createElement("button");
    button.className = `profile-button${name === activeProfile ? " active" : ""}`;
    button.type = "button";
    const count = serversForProfile(name).length;
    button.innerHTML = `<span>${escapeHtml(name)}</span><span class="count">${count}</span>`;
    button.addEventListener("click", () => {
      activeProfile = name;
      selectedServer = serversForProfile(name)[0]?.name || null;
      render();
    });
    el.profilesList.append(button);
  }
}

function renderServers() {
  const query = el.searchBox.value.trim().toLowerCase();
  const servers = serversForProfile(activeProfile).filter((server) => {
    const haystack = `${server.name} ${server.transport} ${server.target} ${server.profiles.join(" ")}`.toLowerCase();
    return haystack.includes(query);
  });
  el.activeTitle.textContent = activeProfile === "all" ? "Servers" : `Profile: ${activeProfile}`;
  const enabled = servers.filter((server) => server.enabled).length;
  el.summaryLine.textContent = `${servers.length} server(s), ${enabled} enabled`;
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
    return;
  }
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
    profile: el.importProfile.value.trim(),
  };
  const path = el.importPath.value.trim();
  if (path) payload.path = path;
  const result = await api("/api/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  showToast(`Imported ${result.imported.length} server(s)`);
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
el.importBtn.addEventListener("click", () => importServers().catch((error) => showToast(error.message)));
el.exportBtn.addEventListener("click", () => exportProfile().catch((error) => showToast(error.message)));
el.scanBtn.addEventListener("click", () => scanProfile().catch((error) => showToast(error.message)));
el.searchBox.addEventListener("input", renderServers);

loadState().catch((error) => showToast(error.message));
