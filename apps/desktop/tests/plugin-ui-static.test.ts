import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = process.env.OPENPETS_DESKTOP_ROOT ?? resolve(dirname(fileURLToPath(import.meta.url)), "..");
const jsHostSource = readFileSync(resolve(desktopRoot, "src/plugin-js-host.ts"), "utf8");
const pluginSdkPreloadSource = readFileSync(resolve(desktopRoot, "plugin-sdk-preload.cjs"), "utf8");
const controlCenterPreloadSource = readFileSync(resolve(desktopRoot, "control-center-preload.cjs"), "utf8");
const controlCenterWindowSource = readFileSync(resolve(desktopRoot, "src/control-center-window.ts"), "utf8");
const controlCenterIpcSource = readFileSync(resolve(desktopRoot, "src/control-center-ipc.ts"), "utf8");
const controlCenterIpcCoreSource = readFileSync(resolve(desktopRoot, "src/control-center-ipc-core.ts"), "utf8");
const controlCenterContractSource = readFileSync(resolve(desktopRoot, "src/shared/control-center-contract.ts"), "utf8");
const controlCenterRendererSource = readFileSync(resolve(desktopRoot, "src/renderer/control-center/src/main.tsx"), "utf8");
const controlCenterRendererHtml = readFileSync(resolve(desktopRoot, "src/renderer/control-center/index.html"), "utf8");
const traySource = readFileSync(resolve(desktopRoot, "src/tray.ts"), "utf8");
assert.equal(existsSync(resolve(desktopRoot, "src/windows.ts")), false, "legacy task-window source must be removed.");
assert.equal(existsSync(resolve(desktopRoot, "preload.cjs")), false, "legacy task-window preload must be removed.");


// Ensure no plugin tabs remain

assert.match(jsHostSource, /OpenPetsPlugin[\s\S]*register/);
assert.match(jsHostSource, /start\(sdk\)/);
assert.match(jsHostSource, /__openPetsRegisteredPlugin[\s\S]*stop/);
assert.match(jsHostSource, /preload: getPluginSdkPreloadPath\(\)/);
assert.match(pluginSdkPreloadSource, /contextBridge\.exposeInMainWorld\("__openPetsSdk", sdk\)/);
assert.match(pluginSdkPreloadSource, /speak: \(message\) => call\("pet\.speak", \[message\]\)/);
assert.match(pluginSdkPreloadSource, /register: \(command, handler\) => call\("commands\.register"/);
assert.match(controlCenterPreloadSource, /getDashboardSnapshot: \(\) => ipcRenderer\.invoke\("openpets:control-center:get-dashboard-snapshot"\)/);
for (const method of ["getOnboardingSnapshot", "completeOnboarding", "openPetsFromOnboarding", "openIntegrationsFromOnboarding"]) assert.match(controlCenterPreloadSource, new RegExp(`${method}:`));
assert.match(controlCenterPreloadSource, /getSettingsSnapshot: \(\) => ipcRenderer\.invoke\("openpets:control-center:get-settings-snapshot"\)/);
assert.match(controlCenterPreloadSource, /getReactionMappingSnapshot: \(\) => ipcRenderer\.invoke\("openpets:control-center:get-reaction-mapping-snapshot"\)/);
for (const method of ["getPetsSnapshot", "getPetCatalogSnapshot", "getPetCatalogPage", "getPetCatalogSearch", "getCodexPetsSnapshot"]) assert.match(controlCenterPreloadSource, new RegExp(`${method}:`));
assert.match(controlCenterPreloadSource, /setLaunchAtLogin: \(enabled\) => ipcRenderer\.invoke\("openpets:control-center:set-launch-at-login", enabled\)/);
assert.match(controlCenterPreloadSource, /setPetScale: \(value\) => ipcRenderer\.invoke\("openpets:control-center:set-pet-scale", value\)/);
assert.match(controlCenterPreloadSource, /resetDefaultPetPosition: \(\) => ipcRenderer\.invoke\("openpets:control-center:reset-default-pet-position"\)/);
assert.match(controlCenterPreloadSource, /setReactionAnimationOverride: \(reactionId, animationId\) => ipcRenderer\.invoke\("openpets:control-center:set-reaction-animation-override", reactionId, animationId\)/);
assert.match(controlCenterPreloadSource, /resetReactionAnimationOverride: \(reactionId\) => ipcRenderer\.invoke\("openpets:control-center:reset-reaction-animation-override", reactionId\)/);
assert.match(controlCenterPreloadSource, /resetReactionAnimationOverrides: \(\) => ipcRenderer\.invoke\("openpets:control-center:reset-reaction-animation-overrides"\)/);
assert.match(controlCenterPreloadSource, /checkForUpdates: \(\) => ipcRenderer\.invoke\("openpets:control-center:check-for-updates"\)/);
assert.match(controlCenterPreloadSource, /openUpdateReleasePage: \(\) => ipcRenderer\.invoke\("openpets:control-center:open-update-release-page"\)/);
for (const method of ["setDefaultPet", "installCatalogPet", "importCodexPet", "removeInstalledPet"]) assert.match(controlCenterPreloadSource, new RegExp(`${method}: \\(petId\\) => ipcRenderer\\.invoke`));
for (const method of ["getAgentSetupSnapshot", "runAgentSetupAction", "updateAgentSetupCommandPaths"]) assert.match(controlCenterPreloadSource, new RegExp(`${method}:`));
for (const method of ["getPluginsSnapshot", "setPluginEnabled", "savePluginConfig", "reloadPlugin", "executePluginCommand", "loadLocalPlugin", "getPluginCatalogSnapshot", "installCatalogPlugin", "updateCatalogPlugin", "uninstallPlugin"]) assert.match(controlCenterPreloadSource, new RegExp(`${method}:`));
for (const channel of ["get-plugins-snapshot", "set-plugin-enabled", "save-plugin-config", "reload-plugin", "execute-plugin-command", "load-local-plugin", "get-plugin-catalog-snapshot", "install-catalog-plugin", "update-catalog-plugin", "uninstall-plugin"]) assert.match(controlCenterIpcSource, new RegExp(`openpets:control-center:${channel}`));
assert.doesNotMatch(controlCenterPreloadSource + controlCenterIpcSource, /plugin-(?:invoke|send|subscribe|mutate)|plugins-mutate|control-center:plugin$/);
assert.match(traySource, /Plugins\.\.\.[\s\S]*openControlCenterPluginsWindow\(\)/, "tray Plugins must open Control Center Plugins.");
for (const channel of ["get-agent-setup-snapshot", "run-agent-setup-action", "update-agent-setup-command-paths"]) assert.match(controlCenterIpcSource, new RegExp(`openpets:control-center:${channel}`));
assert.match(controlCenterWindowSource, /openControlCenterIntegrationsWindow/);
assert.match(traySource, /Integrations\.\.\.[\s\S]*openControlCenterIntegrationsWindow\(\)/);
assert.doesNotMatch(traySource, /Integrations\.\.\.[\s\S]*openTaskWindow\("agent-setup"\)/);
assert.match(controlCenterRendererSource, /#integrations/);
assert.doesNotMatch(controlCenterPreloadSource, /subscribe|ipcRenderer\.on|ipcRenderer\.send|openExternal|require\("node:/);
assert.match(controlCenterWindowSource, /sandbox:\s*true/);
assert.match(controlCenterWindowSource, /contextIsolation:\s*true/);
assert.match(controlCenterWindowSource, /nodeIntegration:\s*false/);
assert.match(controlCenterWindowSource, /if \(app\.isPackaged\) return null/, "Control Center dev URL must be ignored in packaged builds.");
assert.match(controlCenterWindowSource, /isLoopbackControlCenterDevUrl/, "Control Center dev URL must be loopback-gated.");
assert.match(controlCenterWindowSource, /hostname === "localhost"[\s\S]*hostname === "127\.0\.0\.1"[\s\S]*hostname === "::1"/, "Control Center dev URL must only allow loopback hostnames.");
assert.match(controlCenterWindowSource, /loadFile\(join\(distDir, "renderer", "control-center", "index\.html"\), route \? \{ hash: route \} : undefined\)/);
assert.match(controlCenterWindowSource, /openControlCenterPetsWindow/);
assert.match(controlCenterWindowSource, /openControlCenterSettingsWindow/);
assert.match(controlCenterWindowSource, /openControlCenterOnboardingWindow/);
assert.match(controlCenterIpcSource, /isControlCenterWebContents\(event\.sender\)/);
for (const channel of ["get-onboarding-snapshot", "complete-onboarding", "open-pets-from-onboarding", "open-integrations-from-onboarding"]) assert.match(controlCenterIpcSource, new RegExp(`openpets:control-center:${channel}`));
assert.match(controlCenterIpcSource, /openpets:control-center:get-settings-snapshot/);
assert.match(controlCenterIpcSource, /openpets:control-center:get-reaction-mapping-snapshot/);
for (const channel of ["get-pets-snapshot", "get-pet-catalog-snapshot", "get-pet-catalog-page", "get-pet-catalog-search", "get-codex-pets-snapshot"]) assert.match(controlCenterIpcSource, new RegExp(`openpets:control-center:${channel}`));
assert.match(controlCenterIpcSource, /openpets:control-center:set-launch-at-login/);
assert.match(controlCenterIpcSource, /openpets:control-center:set-pet-scale/);
assert.match(controlCenterIpcSource, /openpets:control-center:reset-default-pet-position/);
assert.match(controlCenterIpcSource, /openpets:control-center:set-reaction-animation-override/);
assert.match(controlCenterIpcSource, /openpets:control-center:reset-reaction-animation-override/);
assert.match(controlCenterIpcSource, /openpets:control-center:reset-reaction-animation-overrides/);
assert.match(controlCenterIpcSource, /openpets:control-center:check-for-updates/);
assert.match(controlCenterIpcSource, /openpets:control-center:open-update-release-page/);
for (const channel of ["set-default-pet", "install-catalog-pet", "import-codex-pet", "remove-installed-pet"]) assert.match(controlCenterIpcSource, new RegExp(`openpets:control-center:${channel}`));
assert.match(controlCenterIpcSource, /handleControlCenterSetLaunchAtLoginRequest\(event\.sender, getAuthorizedControlCenterSender\(event\), enabled/);
assert.match(controlCenterIpcSource, /handleControlCenterSetPetScaleRequest\(event\.sender, getAuthorizedControlCenterSender\(event\), value/);
assert.match(controlCenterIpcSource, /handleControlCenterResetDefaultPetPositionRequest\(event\.sender, getAuthorizedControlCenterSender\(event\)/);
assert.match(controlCenterIpcCoreSource, /assertControlCenterBooleanInput\(enabled, "launchAtLogin\.enabled"\)/);
assert.match(controlCenterIpcCoreSource, /assertControlCenterPetScaleInput\(value, deps\.petScaleOptions\)/);
assert.match(controlCenterIpcCoreSource, /updatePreferences\(\{ petScale: value \}\)[\s\S]*refreshDefaultPetContent\(\);[\s\S]*refreshAgentPetContent\(\);/);
assert.match(controlCenterIpcCoreSource, /setLoginItemSettings\(\{ openAtLogin: enabled, openAsHidden: true \}\)/);
assert.match(controlCenterIpcCoreSource, /resetDefaultPetToInitialPosition\(\);[\s\S]*return \{ settings: deps\.getSettingsSnapshot\(\) \}/);
assert.match(controlCenterIpcCoreSource, /buildControlCenterReactionMappingSnapshot/);
assert.match(controlCenterIpcCoreSource, /spriteMetadata:[\s\S]*previewUrl:[\s\S]*version:[\s\S]*spriteFileName/);
assert.doesNotMatch(controlCenterIpcCoreSource, /previewSource/);
assert.doesNotMatch(controlCenterIpcSource, /update-reaction|update-preferences|ipcRenderer|openExternal|openpets:control-center:invoke|openpets:control-center:update(?!(?:-release|-agent-setup-command-paths|-catalog-plugin))|openpets:control-center:send|openpets:control-center:subscribe/);
for (const source of [controlCenterPreloadSource, controlCenterIpcSource, controlCenterContractSource]) assert.doesNotMatch(source, /openpets:control-center:(?:integrations|process|file)(?::|-)|ipcRenderer\.invoke\("openpets:control-center:invoke"/);
assert.match(controlCenterRendererHtml, /img-src data: https:\/\/openpets\.dev openpets-pet-preview: openpets-codex:/);
assert.doesNotMatch(controlCenterRendererHtml, /img-src[^\"]*'self'/);
assert.doesNotMatch(controlCenterRendererHtml, /img-src[^\"]*(?:file:|http:|blob:)/);
for (const source of [controlCenterPreloadSource, controlCenterIpcSource, controlCenterContractSource]) assert.doesNotMatch(source, /openpets:control-center:(?:pet|catalog|install|remove|update)$|openpets:control-center:(?:install|remove|import|set-default)$|setDefaultPetBridge/);
for (const [label, source] of [
  ["Control Center preload", controlCenterPreloadSource],
  ["Control Center IPC", controlCenterIpcSource],
  ["Control Center IPC core", controlCenterIpcCoreSource],
  ["Control Center contract", controlCenterContractSource],
  ["Control Center renderer", controlCenterRendererSource],
] as const) {
  assert.doesNotMatch(source, /releaseUrl/, `${label} must not expose or depend on releaseUrl.`);
}

console.error("Plugin UI static validation passed.");
