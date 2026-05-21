import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import type { ControlCenterAgentSetupAction, ControlCenterAgentSetupCommandMode, ControlCenterAgentSetupSnapshot, ControlCenterCodexPetsSnapshot, ControlCenterDashboardSnapshot, ControlCenterOnboardingSnapshot, ControlCenterPluginCatalogSnapshot, ControlCenterPluginsSnapshot, ControlCenterPetCatalogSearchSnapshot, ControlCenterPetCatalogSnapshot, ControlCenterPetsSnapshot, ControlCenterReactionMappingSnapshot, ControlCenterSettingsSnapshot } from "../../../shared/control-center-contract";
import "./styles.css";

type Route = "dashboard" | "pets" | "plugins" | "integrations" | "settings" | "onboarding";
const integrationActions: readonly ControlCenterAgentSetupAction[] = ["configure", "replace", "remove", "install-memory", "doctor-hooks", "install-hooks", "uninstall-hooks", "opencode-install", "opencode-remove", "cursor-install", "cursor-replace", "cursor-remove"];

function App(): React.JSX.Element {
  const [route, setRoute] = useState<Route>(() => getRouteFromHash());

  useEffect(() => {
    const onHashChange = (): void => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Experimental</p>
        <h1>OpenPets Control Center</h1>
        <p className="lede">A safe preview of the new desktop dashboard and narrowly scoped app settings.</p>
      </section>
      <nav className="tabs" aria-label="Control Center sections">
        <a className={route === "dashboard" ? "active" : ""} href="#dashboard">Dashboard</a>
        <a className={route === "pets" ? "active" : ""} href="#pets">Pets</a>
        <a className={route === "plugins" ? "active" : ""} href="#plugins">Plugins</a>
        <a className={route === "integrations" ? "active" : ""} href="#integrations">Integrations</a>
        <a className={route === "settings" ? "active" : ""} href="#settings">Settings/App</a>
      </nav>
      {route === "onboarding" ? <OnboardingView /> : route === "settings" ? <SettingsView /> : route === "integrations" ? <IntegrationsView /> : route === "plugins" ? <PluginsView /> : route === "pets" ? <PetsView /> : <DashboardView />}
    </main>
  );
}

function OnboardingView(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<ControlCenterOnboardingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  useEffect(() => { window.openPetsControlCenter.getOnboardingSnapshot().then(setSnapshot).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load onboarding.")); }, []);
  const openPets = async (): Promise<void> => { try { await window.openPetsControlCenter.openPetsFromOnboarding(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to open pets."); } };
  const openIntegrations = async (): Promise<void> => { try { await window.openPetsControlCenter.openIntegrationsFromOnboarding(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to open integrations."); } };
  const finish = async (): Promise<void> => { if (finishing) return; setFinishing(true); setError(null); try { setSnapshot(await window.openPetsControlCenter.completeOnboarding()); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to complete onboarding."); } finally { setFinishing(false); } };
  return <SnapshotCard title="Welcome to OpenPets" eyebrow="Onboarding" badge="Setup" error={error} loading="Loading setup…">{snapshot ? <div className="onboardingRoute"><p className="lede">Your default pet is <strong>{snapshot.defaultPetName}</strong>. Finish setup now or jump into the focused setup sections.</p><div className="grid"><div className="metric"><span>1. Pick a pet</span><strong>{snapshot.defaultPetName}</strong><button type="button" onClick={openPets}>Open Pets</button></div><div className="metric"><span>2. Connect agents</span><strong>Claude, OpenCode, Cursor</strong><button type="button" onClick={openIntegrations}>Open Integrations</button></div><div className="metric"><span>3. Finish</span><strong>{snapshot.onboardingCompleted ? "Complete" : "Ready"}</strong><button type="button" disabled={finishing || snapshot.onboardingCompleted} onClick={finish}>{snapshot.onboardingCompleted ? "Completed" : finishing ? "Finishing…" : "Finish setup"}</button></div></div></div> : null}</SnapshotCard>;
}

function PluginsView(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<ControlCenterPluginsSnapshot | null>(null);
  const [catalog, setCatalog] = useState<ControlCenterPluginCatalogSnapshot | null>(null);
  const [configText, setConfigText] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const load = async (refresh = false): Promise<void> => {
    const [nextSnapshot, nextCatalog] = await Promise.all([window.openPetsControlCenter.getPluginsSnapshot(), window.openPetsControlCenter.getPluginCatalogSnapshot(refresh)]);
    setSnapshot(nextSnapshot); setCatalog(nextCatalog); setConfigText(Object.fromEntries(nextSnapshot.plugins.map((plugin) => [plugin.id, JSON.stringify(plugin.effectiveConfig ?? {}, null, 2)]))); setError(null);
  };
  useEffect(() => { load().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load plugins.")); }, []);
  const mutate = async (label: string, action: () => Promise<{ ok: boolean; error?: string; snapshot: ControlCenterPluginsSnapshot }>): Promise<void> => {
    if (busy) return; setBusy(true); setError(null);
    try { const result = await action(); setSnapshot(result.snapshot); setLastAction(result.ok ? label : `${label}: ${result.error ?? "failed"}`); await load(false); } catch (cause) { setError(cause instanceof Error ? cause.message : `${label} failed.`); } finally { setBusy(false); }
  };
  return <SnapshotCard title="Plugins preview" eyebrow="Plugins" badge="Exact plugin actions" error={error} loading="Loading plugins…">{snapshot && catalog ? <div className="pluginsRoute"><div className="controls"><button disabled={busy} onClick={() => mutate("Loaded local plugin", () => window.openPetsControlCenter.loadLocalPlugin())}>Load local plugin</button><button className="secondaryButton" disabled={busy} onClick={() => load(true).catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to refresh catalog."))}>Refresh catalog</button></div>{lastAction ? <p className="muted">Last action: {lastAction}</p> : null}<div className="grid"><Metric label="Installed plugins" value={String(snapshot.plugins.length)} /><Metric label="Catalog plugins" value={String(catalog.plugins.length)} /></div><section className="petList"><h3>Installed plugins</h3>{snapshot.plugins.length === 0 ? <p className="muted">No plugins installed.</p> : <div className="petCards">{snapshot.plugins.map((plugin) => <article className="petCard" key={plugin.id}><span className="petFallback">🔌</span><div><strong>{plugin.name ?? plugin.id}</strong><small>{plugin.id} · {plugin.version} · {plugin.source} · {plugin.runtime ?? "runtime?"}</small><p>Permissions: {plugin.approvedPermissions.join(", ") || "none"}</p>{plugin.status ? <p>Status: {plugin.status.text}{plugin.status.tone ? ` · ${plugin.status.tone}` : ""}</p> : null}{plugin.configErrors?.length ? <p className="error">Config errors: {plugin.configErrors.map((item) => item.message).join("; ")}</p> : null}<textarea value={configText[plugin.id] ?? "{}"} disabled={busy} onChange={(event) => setConfigText({ ...configText, [plugin.id]: event.currentTarget.value })} /><div className="petActions"><button disabled={busy} onClick={() => mutate(plugin.enabled ? "Disabled plugin" : "Enabled plugin", () => window.openPetsControlCenter.setPluginEnabled(plugin.id, !plugin.enabled))}>{plugin.enabled ? "Disable" : "Enable"}</button><button className="secondaryButton" disabled={busy} onClick={() => mutate("Reloaded plugin", () => window.openPetsControlCenter.reloadPlugin(plugin.id))}>Reload</button><button className="secondaryButton" disabled={busy} onClick={() => mutate("Saved config", () => window.openPetsControlCenter.savePluginConfig(plugin.id, JSON.parse(configText[plugin.id] ?? "{}")))}>Save config</button><button className="secondaryButton" disabled={busy} onClick={() => mutate("Uninstalled plugin", () => window.openPetsControlCenter.uninstallPlugin(plugin.id))}>Uninstall</button>{plugin.commands?.map((command) => <button key={command.id} disabled={busy} onClick={() => mutate(`Ran ${command.id}`, () => window.openPetsControlCenter.executePluginCommand(plugin.id, command.id))}>{command.title ?? command.id}</button>)}</div></div><span className="pill">{plugin.enabled ? "Enabled" : plugin.brokenReason ? "Broken" : "Disabled"}</span></article>)}</div>}</section><section className="petList"><h3>Catalog plugins</h3><div className="petCards">{catalog.plugins.map((plugin) => <article className="petCard" key={plugin.id}><span className="petFallback">🧩</span><div><strong>{plugin.name}</strong><small>{plugin.id} · {plugin.version} · {plugin.runtime}</small><p>{plugin.description}</p><p>Permissions: {plugin.permissions.join(", ") || "none"}</p><div className="petActions"><button disabled={busy || plugin.installed} onClick={() => mutate("Installed catalog plugin", () => window.openPetsControlCenter.installCatalogPlugin(plugin.id))}>{plugin.installed ? "Installed" : "Install"}</button><button className="secondaryButton" disabled={busy || !plugin.installed} onClick={() => mutate("Updated catalog plugin", () => window.openPetsControlCenter.updateCatalogPlugin(plugin.id))}>Update</button></div></div>{plugin.deprecated ? <span className="pill">Deprecated</span> : null}</article>)}</div></section></div> : null}</SnapshotCard>;
}

function IntegrationsView(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<ControlCenterAgentSetupSnapshot | null>(null);
  const [selectedPetId, setSelectedPetId] = useState<string | undefined>();
  const [commandMode, setCommandMode] = useState<ControlCenterAgentSetupCommandMode>("published");
  const [paths, setPaths] = useState({ claude: "", node: "", opencode: "" });
  const [error, setError] = useState<string | null>(null);
  const load = async (petId = selectedPetId, mode = commandMode): Promise<void> => {
    try { const next = await window.openPetsControlCenter.getAgentSetupSnapshot(petId, mode); setSnapshot(next); setSelectedPetId(next.selectedPetId); setCommandMode(next.commandMode); setPaths(next.commandPaths); setError(null); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to load integrations."); }
  };
  useEffect(() => { void load(undefined, "published"); }, []);
  const run = async (action: ControlCenterAgentSetupAction): Promise<void> => {
    if (snapshot?.busy) return;
    try { setSnapshot(await window.openPetsControlCenter.runAgentSetupAction(action, selectedPetId, commandMode)); setError(null); void load(selectedPetId, commandMode); } catch (cause) { setError(cause instanceof Error ? cause.message : "Integration action failed."); }
  };
  const savePaths = async (): Promise<void> => {
    try { setPaths(await window.openPetsControlCenter.updateAgentSetupCommandPaths(paths)); void load(selectedPetId, commandMode); } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save command paths."); }
  };
  return <SnapshotCard title="Integrations preview" eyebrow="Integrations" badge="Explicit actions" error={error} loading="Loading integrations…">{snapshot ? <div className="integrationsRoute"><div className="controls"><label>Pet <select value={selectedPetId ?? ""} disabled={snapshot.busy} onChange={(event) => { const petId = event.currentTarget.value || undefined; setSelectedPetId(petId); void load(petId, commandMode); }}><option value="">Default pet</option>{snapshot.petOptions.map((pet) => <option key={pet.id} value={pet.id}>{pet.displayName}{pet.default ? " (default)" : ""}</option>)}</select></label><label>Command mode <select value={commandMode} disabled={snapshot.busy} onChange={(event) => { const mode = event.currentTarget.value as ControlCenterAgentSetupCommandMode; setCommandMode(mode); void load(selectedPetId, mode); }}><option value="published">published</option>{snapshot.localDevAvailable ? <option value="local">local</option> : null}<option value="bundled">bundled</option></select></label></div>{snapshot.lastAction ? <p className={snapshot.lastAction.ok ? "muted" : "error"}>{snapshot.lastAction.action}: {snapshot.lastAction.message}</p> : null}<div className="grid"><Metric label="Claude" value={snapshot.status.label} detail={snapshot.status.details} /><Metric label="Claude hooks" value="Doctor preview" detail={JSON.stringify(snapshot.hookStatus).slice(0, 120)} /><Metric label="Memory" value="Memory preview" detail={JSON.stringify(snapshot.memoryStatus).slice(0, 120)} /><Metric label="OpenCode" value={snapshot.opencodeStatus.label} detail={snapshot.opencodeStatus.details} /><Metric label="Cursor" value={snapshot.cursorStatus.label} detail={snapshot.cursorStatus.details} /></div><section className="commandPaths"><h3>Command paths</h3>{(["claude", "node", "opencode"] as const).map((key) => <label key={key}>{key}<input value={paths[key]} disabled={snapshot.busy} onChange={(event) => setPaths({ ...paths, [key]: event.currentTarget.value })} /></label>)}<button type="button" disabled={snapshot.busy} onClick={savePaths}>Save command paths</button></section><div className="actionBar">{integrationActions.map((action) => <button key={action} type="button" disabled={snapshot.busy} onClick={() => run(action)}>{action}</button>)}</div><Preview title="Claude preview" value={JSON.stringify(snapshot.preview, null, 2)} /><Preview title="Claude hooks preview" value={JSON.stringify(snapshot.hookStatus, null, 2)} /><Preview title="Claude memory preview" value={JSON.stringify(snapshot.memoryStatus, null, 2)} /><Preview title="OpenCode config preview" value={JSON.stringify(snapshot.opencodePreview.configPreview, null, 2)} /><Preview title="OpenCode MCP command" value={snapshot.opencodePreview.mcpCommand.join(" ")} /><Preview title="Cursor MCP entry" value={JSON.stringify(snapshot.cursorPreview.mcpEntry, null, 2)} /><Preview title="Cursor rules" value={snapshot.cursorPreview.rulesContent} /></div> : null}</SnapshotCard>;
}

function Preview({ title, value }: { readonly title: string; readonly value: string }): React.JSX.Element { return <section className="previewBlock"><h3>{title}</h3><pre>{value}</pre></section>; }

function PetsView(): React.JSX.Element {
  const [pets, setPets] = useState<ControlCenterPetsSnapshot | null>(null);
  const [catalog, setCatalog] = useState<ControlCenterPetCatalogSnapshot | null>(null);
  const [search, setSearch] = useState<ControlCenterPetCatalogSearchSnapshot | null>(null);
  const [codex, setCodex] = useState<ControlCenterCodexPetsSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingPetId, setSavingPetId] = useState<string | null>(null);
  useEffect(() => {
    Promise.all([window.openPetsControlCenter.getPetsSnapshot(), window.openPetsControlCenter.getPetCatalogSnapshot(), window.openPetsControlCenter.getPetCatalogSearch(), window.openPetsControlCenter.getCodexPetsSnapshot()])
      .then(([petsSnapshot, catalogSnapshot, searchSnapshot, codexSnapshot]) => { setPets(petsSnapshot); setCatalog(catalogSnapshot); setSearch(searchSnapshot); setCodex(codexSnapshot); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load pets."));
  }, []);
  const mutatePet = async (petId: string, action: (petId: string) => Promise<{ pets: ControlCenterPetsSnapshot }>, failure: string): Promise<void> => {
    if (savingPetId) return;
    setSavingPetId(petId);
    setError(null);
    try {
      const result = await action(petId);
      setPets(result.pets);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : failure);
    } finally {
      setSavingPetId(null);
    }
  };
  return <SnapshotCard title="Pet Manager preview" eyebrow="Pets" badge="Limited pet controls" error={error} loading="Loading pets…">{pets && catalog && search && codex ? <Pets pets={pets} catalog={catalog} search={search} codex={codex} savingPetId={savingPetId} onSetDefault={(petId) => mutatePet(petId, window.openPetsControlCenter.setDefaultPet, "Unable to set default pet.")} onInstallCatalog={(petId) => mutatePet(petId, window.openPetsControlCenter.installCatalogPet, "Unable to install catalog pet.")} onImportCodex={(petId) => mutatePet(petId, window.openPetsControlCenter.importCodexPet, "Unable to import Codex pet.")} onRemoveInstalled={(petId) => mutatePet(petId, window.openPetsControlCenter.removeInstalledPet, "Unable to remove pet.")} /> : null}</SnapshotCard>;
}

function Pets({ pets, catalog, search, codex, savingPetId, onSetDefault, onInstallCatalog, onImportCodex, onRemoveInstalled }: { readonly pets: ControlCenterPetsSnapshot; readonly catalog: ControlCenterPetCatalogSnapshot; readonly search: ControlCenterPetCatalogSearchSnapshot; readonly codex: ControlCenterCodexPetsSnapshot; readonly savingPetId: string | null; readonly onSetDefault: (petId: string) => void; readonly onInstallCatalog: (petId: string) => void; readonly onImportCodex: (petId: string) => void; readonly onRemoveInstalled: (petId: string) => void }): React.JSX.Element {
  const installedIds = new Set(pets.pets.map((pet) => pet.id));
  return <div className="petsRoute"><p className="muted">Pet writes use exact Control Center actions and return a refreshed installed-pets snapshot.</p><div className="grid"><Metric label="Installed pets" value={String(pets.installedCount)} /><Metric label="Default pet id" value={pets.defaultPetId} /><Metric label="Catalog" value={`${catalog.pets.length} shown`} detail={catalog.error ?? `Source: ${catalog.source}${catalog.pageCount ? ` · page ${(catalog.page ?? 0) + 1}/${catalog.pageCount}` : ""}`} /><Metric label="Search index" value={`${search.pets.length} pets`} detail={search.error} /><Metric label="Codex pets" value={`${codex.pets.length} local`} detail={codex.error} /></div><PetList title="Installed/default" pets={pets.pets.map((pet) => ({ id: pet.id, displayName: pet.displayName, description: pet.description ?? (pet.default ? "Default pet" : "Installed pet"), preview: pet.source?.kind === "catalog" ? pet.source.preview : undefined, badge: pet.default ? "Default" : pet.builtIn ? "Built-in" : pet.broken ? "Broken" : "Installed", actions: <>{!pet.default ? <button type="button" disabled={Boolean(savingPetId)} onClick={() => onSetDefault(pet.id)}>{savingPetId === pet.id ? "Saving…" : "Set default"}</button> : null}{!pet.builtIn && !pet.protected ? <button className="secondaryButton" type="button" disabled={Boolean(savingPetId)} onClick={() => onRemoveInstalled(pet.id)}>{savingPetId === pet.id ? "Saving…" : "Remove"}</button> : null}</> }))} /><PetList title="Catalog page" pets={catalog.pets.slice(0, 8).map((pet) => ({ id: pet.id, displayName: pet.displayName, description: pet.description ?? pet.category ?? "Catalog pet", preview: pet.preview, badge: pet.featured ? "Featured" : pet.original ? "Original" : pet.category, actions: installedIds.has(pet.id) ? null : <button type="button" disabled={Boolean(savingPetId)} onClick={() => onInstallCatalog(pet.id)}>{savingPetId === pet.id ? "Installing…" : "Install"}</button> }))} /><PetList title="Codex development pets" pets={codex.pets.map((pet) => ({ id: pet.id, displayName: pet.displayName, description: pet.description, preview: pet.preview, badge: "Codex", actions: installedIds.has(pet.id) ? null : <button type="button" disabled={Boolean(savingPetId)} onClick={() => onImportCodex(pet.id)}>{savingPetId === pet.id ? "Importing…" : "Import"}</button> }))} /></div>;
}

function PetList({ title, pets }: { readonly title: string; readonly pets: readonly { readonly id: string; readonly displayName: string; readonly description?: string; readonly preview?: string; readonly badge?: string; readonly actions?: React.ReactNode }[] }): React.JSX.Element {
  return <section className="petList"><h3>{title}</h3>{pets.length === 0 ? <p className="muted">No pets found.</p> : <div className="petCards">{pets.map((pet) => <article className="petCard" key={pet.id}>{pet.preview ? <img src={pet.preview} alt="" /> : <span className="petFallback">🐾</span>}<div><strong>{pet.displayName}</strong><small>{pet.id}</small>{pet.description ? <p>{pet.description}</p> : null}{pet.actions ? <div className="petActions">{pet.actions}</div> : null}</div>{pet.badge ? <span className="pill">{pet.badge}</span> : null}</article>)}</div>}</section>;
}

function DashboardView(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<ControlCenterDashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.openPetsControlCenter.getDashboardSnapshot()
      .then(setSnapshot)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load dashboard."));
  }, []);

  return <SnapshotCard title="Current app snapshot" eyebrow="Dashboard" badge="Read only" error={error} loading="Loading dashboard…">{snapshot ? <Dashboard snapshot={snapshot} /> : null}</SnapshotCard>;
}

function SettingsView(): React.JSX.Element {
  const [snapshot, setSnapshot] = useState<ControlCenterSettingsSnapshot | null>(null);
  const [reactionMapping, setReactionMapping] = useState<ControlCenterReactionMappingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);

  useEffect(() => {
    Promise.all([window.openPetsControlCenter.getSettingsSnapshot(), window.openPetsControlCenter.getReactionMappingSnapshot()])
      .then(([settingsSnapshot, reactionMappingSnapshot]) => { setSnapshot(settingsSnapshot); setReactionMapping(reactionMappingSnapshot); })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Unable to load settings."));
  }, []);

  const onToggleLaunchAtLogin = async (): Promise<void> => {
    if (!snapshot?.launchAtLogin.supported || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await window.openPetsControlCenter.setLaunchAtLogin(!snapshot.launchAtLogin.enabled);
      setSnapshot(result.settings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update launch at login.");
    } finally {
      setSaving(false);
    }
  };

  const onSetPetScale = async (value: number): Promise<void> => {
    if (!snapshot || saving || value === snapshot.petScale.value) return;
    setSaving(true);
    setError(null);
    try {
      const result = await window.openPetsControlCenter.setPetScale(value);
      setSnapshot(result.settings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update pet scale.");
    } finally {
      setSaving(false);
    }
  };

  const onResetDefaultPetPosition = async (): Promise<void> => {
    if (!snapshot || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await window.openPetsControlCenter.resetDefaultPetPosition();
      setSnapshot(result.settings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to reset default pet position.");
    } finally {
      setSaving(false);
    }
  };

  const applyReactionMutation = async (action: () => Promise<{ settings: ControlCenterSettingsSnapshot; reactionMapping: ControlCenterReactionMappingSnapshot }>, failure: string): Promise<void> => {
    if (!snapshot || saving) return;
    setSaving(true);
    setError(null);
    try {
      const result = await action();
      setSnapshot(result.settings);
      setReactionMapping(result.reactionMapping);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : failure);
    } finally {
      setSaving(false);
    }
  };

  const onCheckForUpdates = async (): Promise<void> => {
    if (!snapshot || saving || checkingUpdates) return;
    setCheckingUpdates(true);
    setError(null);
    try {
      const result = await window.openPetsControlCenter.checkForUpdates();
      setSnapshot(result.settings);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to check for updates.");
    } finally {
      setCheckingUpdates(false);
    }
  };

  const onOpenUpdateReleasePage = async (): Promise<void> => {
    if (snapshot?.updateStatus.state !== "available" || saving || checkingUpdates) return;
    setError(null);
    try {
      await window.openPetsControlCenter.openUpdateReleasePage();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open release page.");
    }
  };

  return <SnapshotCard title="App settings snapshot" eyebrow="Settings/App" badge="Limited settings controls" error={error} loading="Loading settings…">{snapshot ? <Settings snapshot={snapshot} reactionMapping={reactionMapping} saving={saving} checkingUpdates={checkingUpdates} onToggleLaunchAtLogin={onToggleLaunchAtLogin} onSetPetScale={onSetPetScale} onResetDefaultPetPosition={onResetDefaultPetPosition} onCheckForUpdates={onCheckForUpdates} onOpenUpdateReleasePage={onOpenUpdateReleasePage} onSetReactionAnimationOverride={(reactionId, animationId) => applyReactionMutation(() => window.openPetsControlCenter.setReactionAnimationOverride(reactionId, animationId), "Unable to update reaction mapping.")} onResetReactionAnimationOverride={(reactionId) => applyReactionMutation(() => window.openPetsControlCenter.resetReactionAnimationOverride(reactionId), "Unable to reset reaction mapping.")} onResetReactionAnimationOverrides={() => applyReactionMutation(() => window.openPetsControlCenter.resetReactionAnimationOverrides(), "Unable to reset reaction mappings.")} /> : null}</SnapshotCard>;
}

function SnapshotCard({ title, eyebrow, badge, error, loading, children }: { readonly title: string; readonly eyebrow: string; readonly badge: string; readonly error: string | null; readonly loading: string; readonly children: React.ReactNode }): React.JSX.Element {
  return (
    <section className="card" aria-label={title}>
      <div className="cardHeader"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><span className="pill">{badge}</span></div>
      {error ? <p className="error">{error}</p> : children ?? <p className="muted">{loading}</p>}
    </section>
  );
}

function Dashboard({ snapshot }: { readonly snapshot: ControlCenterDashboardSnapshot }): React.JSX.Element {
  const updateLabel = snapshot.updateStatus.state === "available" && snapshot.updateStatus.latestVersion
    ? `Update available: ${snapshot.updateStatus.latestVersion}`
    : snapshot.updateStatus.state;
  return (
    <div className="grid">
      <Metric label="App version" value={snapshot.appVersion} />
      <Metric label="Default pet" value={snapshot.defaultPetName} />
      <Metric label="Onboarding" value={snapshot.onboardingCompleted ? "Completed" : "Not completed"} />
      <Metric label="Update status" value={updateLabel} />
    </div>
  );
}

function Settings({ snapshot, reactionMapping, saving, checkingUpdates, onToggleLaunchAtLogin, onSetPetScale, onResetDefaultPetPosition, onCheckForUpdates, onOpenUpdateReleasePage, onSetReactionAnimationOverride, onResetReactionAnimationOverride, onResetReactionAnimationOverrides }: { readonly snapshot: ControlCenterSettingsSnapshot; readonly reactionMapping: ControlCenterReactionMappingSnapshot | null; readonly saving: boolean; readonly checkingUpdates: boolean; readonly onToggleLaunchAtLogin: () => void; readonly onSetPetScale: (value: number) => void; readonly onResetDefaultPetPosition: () => void; readonly onCheckForUpdates: () => void; readonly onOpenUpdateReleasePage: () => void; readonly onSetReactionAnimationOverride: (reactionId: string, animationId: string) => void; readonly onResetReactionAnimationOverride: (reactionId: string) => void; readonly onResetReactionAnimationOverrides: () => void }): React.JSX.Element {
  const reactionLabel = snapshot.reactionAnimations.overriddenReactions === 0 ? `Defaults for ${snapshot.reactionAnimations.totalReactions} reactions` : `${snapshot.reactionAnimations.overriddenReactions} of ${snapshot.reactionAnimations.totalReactions} overridden`;
  return (
    <div className="grid">
      <Metric label="App version" value={snapshot.appVersion} />
      <Metric label="Default pet" value={snapshot.defaultPetName} />
      <Metric label="Onboarding" value={snapshot.onboardingCompleted ? "Completed" : "Not completed"} />
      <div className="metric launchToggle"><span>Launch at login</span><strong>{snapshot.launchAtLogin.supported ? (snapshot.launchAtLogin.enabled ? "Enabled" : "Disabled") : "Unsupported"}</strong><button type="button" disabled={!snapshot.launchAtLogin.supported || saving} onClick={onToggleLaunchAtLogin}>{snapshot.launchAtLogin.supported ? (saving ? "Saving…" : snapshot.launchAtLogin.enabled ? "Turn off" : "Turn on") : "Not supported on this OS"}</button></div>
      <UpdateControl snapshot={snapshot} saving={saving} checkingUpdates={checkingUpdates} onCheckForUpdates={onCheckForUpdates} onOpenUpdateReleasePage={onOpenUpdateReleasePage} />
      <div className="metric scaleControl"><span>Pet controls</span><strong>{snapshot.petScale.label}</strong><div className="segmented" role="group" aria-label="Pet scale">{snapshot.petScaleOptions.map((option) => <button key={option.value} type="button" className={option.value === snapshot.petScale.value ? "active" : ""} disabled={saving} onClick={() => onSetPetScale(option.value)}>{option.label}</button>)}</div><button className="secondaryButton" type="button" disabled={saving} onClick={onResetDefaultPetPosition}>Reset default pet position</button></div>
      <Metric label="Reaction animations" value={reactionLabel} detail={snapshot.reactionAnimations.overrideLabels.join(", ")} />
      {reactionMapping ? <ReactionMappingSection snapshot={reactionMapping} saving={saving} onSetReactionAnimationOverride={onSetReactionAnimationOverride} onResetReactionAnimationOverride={onResetReactionAnimationOverride} onResetReactionAnimationOverrides={onResetReactionAnimationOverrides} /> : <p className="muted">Loading reaction mapping…</p>}
    </div>
  );
}

function UpdateControl({ snapshot, saving, checkingUpdates, onCheckForUpdates, onOpenUpdateReleasePage }: { readonly snapshot: ControlCenterSettingsSnapshot; readonly saving: boolean; readonly checkingUpdates: boolean; readonly onCheckForUpdates: () => void; readonly onOpenUpdateReleasePage: () => void }): React.JSX.Element {
  const status = snapshot.updateStatus;
  const checkedAt = status.checkedAt ? new Date(status.checkedAt).toLocaleString() : undefined;
  return <div className="metric updateControl"><span>App updates</span><strong>{status.state}</strong><small>Current: {status.currentVersion}{status.latestVersion ? ` · Latest: ${status.latestVersion}` : ""}</small>{checkedAt ? <small>Checked: {checkedAt}</small> : null}{status.error ? <small className="error">{status.error}</small> : null}<div className="updateActions"><button type="button" disabled={saving || checkingUpdates} onClick={onCheckForUpdates}>{checkingUpdates ? "Checking…" : "Check"}</button><button className="secondaryButton" type="button" disabled={saving || checkingUpdates || status.state !== "available"} onClick={onOpenUpdateReleasePage}>Open release</button></div></div>;
}

function ReactionMappingSection({ snapshot, saving, onSetReactionAnimationOverride, onResetReactionAnimationOverride, onResetReactionAnimationOverrides }: { readonly snapshot: ControlCenterReactionMappingSnapshot; readonly saving: boolean; readonly onSetReactionAnimationOverride: (reactionId: string, animationId: string) => void; readonly onResetReactionAnimationOverride: (reactionId: string) => void; readonly onResetReactionAnimationOverrides: () => void }): React.JSX.Element {
  const hasOverrides = snapshot.overrides.length > 0;
  return (
    <section className="reactionMapping">
      <div className="mappingIntro"><div><span>Reaction mapping editor</span><strong>Choose animations per reaction</strong></div><small>Preview uses the current default pet through the internal openpets-pet-preview protocol.</small><button className="secondaryButton" type="button" disabled={saving || !hasOverrides} onClick={onResetReactionAnimationOverrides}>Reset all defaults</button></div>
      <div className="mappingTable" role="table" aria-label="Reaction animation mapping">
        <div className="mappingRow mappingHead" role="row"><span>Preview</span><span>Reaction</span><span>Animation</span><span>Default</span><span>Reset</span></div>
        {snapshot.reactions.map((reaction) => <div className="mappingRow" role="row" key={reaction.id}><ReactionPreview snapshot={snapshot} animationId={reaction.currentAnimation} /><span><strong>{reaction.label}</strong><small>{reaction.description}</small></span><span><select disabled={saving} value={reaction.currentAnimation} onChange={(event) => onSetReactionAnimationOverride(reaction.id, event.currentTarget.value)}>{snapshot.selectableAnimations.map((animation) => <option key={animation.id} value={animation.id}>{animation.label}</option>)}</select></span><span>{labelForAnimation(snapshot, reaction.defaultAnimation)}</span><span><button className="secondaryButton" type="button" disabled={saving || !reaction.overridden} onClick={() => onResetReactionAnimationOverride(reaction.id)}>{reaction.overridden ? "Reset" : "Default"}</button></span></div>)}
      </div>
    </section>
  );
}

function ReactionPreview({ snapshot, animationId }: { readonly snapshot: ControlCenterReactionMappingSnapshot; readonly animationId: string }): React.JSX.Element {
  const state = snapshot.spriteMetadata.states.find((entry) => entry.id === animationId) ?? snapshot.spriteMetadata.states[0];
  const style = state ? {
    "--preview-row-y": `-${state.row * snapshot.spriteMetadata.frameHeight}px`,
    "--preview-frames": `${state.frames}`,
    "--preview-duration": `${state.durationMs}ms`,
    "--preview-iterations": `${state.iterations ?? "infinite"}`,
    backgroundImage: `url("${snapshot.spriteMetadata.previewUrl}")`,
    backgroundSize: `${snapshot.spriteMetadata.columns * snapshot.spriteMetadata.frameWidth}px ${snapshot.spriteMetadata.rows * snapshot.spriteMetadata.frameHeight}px`,
  } as React.CSSProperties : undefined;
  return <span className="mappingPreview"><span className="mappingPreviewSprite" style={style} /></span>;
}

function labelForAnimation(snapshot: ControlCenterReactionMappingSnapshot, id: string): string {
  return snapshot.selectableAnimations.find((animation) => animation.id === id)?.label ?? id;
}

function Metric({ label, value, detail }: { readonly label: string; readonly value: string; readonly detail?: string }): React.JSX.Element {
  return <div className="metric"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>;
}

function getRouteFromHash(): Route {
  return window.location.hash === "#onboarding" ? "onboarding" : window.location.hash === "#settings" ? "settings" : window.location.hash === "#integrations" ? "integrations" : window.location.hash === "#plugins" ? "plugins" : window.location.hash === "#pets" ? "pets" : "dashboard";
}

createRoot(document.getElementById("root")!).render(<App />);
