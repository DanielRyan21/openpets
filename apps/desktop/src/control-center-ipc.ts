import { app, ipcMain, type IpcMainInvokeEvent, type WebContents } from "electron";

import { refreshAgentPetContent } from "./agent-pet-controller.js";
import { getAgentSetupSnapshot, runAgentSetupAction, updateAgentSetupCommandPaths } from "./agent-setup.js";
import { completeOnboarding, getAppStateSnapshot, petScaleOptions, updatePreferences } from "./app-state.js";
import { assertAuthorizedControlCenterSender, buildControlCenterDashboardSnapshot, buildControlCenterOnboardingSnapshot, buildControlCenterReactionMappingSnapshot, buildControlCenterSettingsSnapshot, handleControlCenterCheckForUpdatesRequest, handleControlCenterGetAgentSetupSnapshotRequest, handleControlCenterGetCodexPetsSnapshotRequest, handleControlCenterGetPetCatalogPageRequest, handleControlCenterGetPetCatalogSearchRequest, handleControlCenterGetPetCatalogSnapshotRequest, handleControlCenterGetPetsSnapshotRequest, handleControlCenterGetPluginCatalogSnapshotRequest, handleControlCenterGetPluginsSnapshotRequest, handleControlCenterLoadLocalPluginRequest, handleControlCenterOpenUpdateReleasePageRequest, handleControlCenterPetMutationRequest, handleControlCenterPluginCommandRequest, handleControlCenterPluginConfigRequest, handleControlCenterPluginEnabledRequest, handleControlCenterPluginIdMutationRequest, handleControlCenterResetDefaultPetPositionRequest, handleControlCenterResetReactionAnimationOverrideRequest, handleControlCenterResetReactionAnimationOverridesRequest, handleControlCenterRunAgentSetupActionRequest, handleControlCenterSetLaunchAtLoginRequest, handleControlCenterSetPetScaleRequest, handleControlCenterSetReactionAnimationOverrideRequest, handleControlCenterUpdateAgentSetupCommandPathsRequest, type ControlCenterReactionMappingMutationDependencies, type ControlCenterSnapshotDependencies } from "./control-center-ipc-core.js";
import { getCatalogPageUiState, getCatalogSearchUiState, getCatalogUiState } from "./catalog.js";
import { getCodexPetsUiState } from "./codex-pets.js";
import { importCodexPet } from "./codex-pets.js";
import { getDefaultPetPreviewSpriteInfo } from "./default-pet-preview.js";
import { recoverDefaultPetMouseInterop, refreshDefaultPetContent, resetDefaultPetToInitialPosition } from "./default-pet-controller.js";
import { isControlCenterWebContents, openControlCenterIntegrationsWindow, openControlCenterPetsWindow } from "./control-center-window.js";
import { defaultPetSprite, reactionAnimationMetadata, selectableAnimationMetadata } from "./reaction-animation-mapping.js";
import { checkForGitHubReleaseUpdate, getUpdateStatus, openUpdateReleasePage } from "./update-checker.js";
import type { ControlCenterDashboardSnapshot, ControlCenterReactionMappingSnapshot, ControlCenterSettingsSnapshot } from "./shared/control-center-contract.js";
import { installPet, removePet, setDefaultInstalledPet } from "./pet-installation.js";
import { getPluginService } from "./plugin-service.js";

let installed = false;

export function installControlCenterIpcHandlers(): void {
  if (installed) return;
  installed = true;
  ipcMain.handle("openpets:control-center:get-dashboard-snapshot", (event) => {
    assertControlCenterSender(event);
    return getDashboardSnapshot();
  });
  ipcMain.handle("openpets:control-center:get-onboarding-snapshot", (event) => {
    assertControlCenterSender(event);
    return buildControlCenterOnboardingSnapshot(getAppStateSnapshot());
  });
  ipcMain.handle("openpets:control-center:complete-onboarding", async (event) => {
    assertControlCenterSender(event);
    const state = completeOnboarding();
    await asyncRefreshTrayMenu();
    return buildControlCenterOnboardingSnapshot(state);
  });
  ipcMain.handle("openpets:control-center:open-pets-from-onboarding", async (event) => {
    assertControlCenterSender(event);
    openControlCenterPetsWindow();
  });
  ipcMain.handle("openpets:control-center:open-integrations-from-onboarding", async (event) => {
    assertControlCenterSender(event);
    openControlCenterIntegrationsWindow();
  });
  ipcMain.handle("openpets:control-center:get-settings-snapshot", (event) => {
    assertControlCenterSender(event);
    return getSettingsSnapshot();
  });
  ipcMain.handle("openpets:control-center:get-reaction-mapping-snapshot", (event) => {
    const controlCenterSender = getAuthorizedControlCenterSender(event);
    assertAuthorizedControlCenterSender(event.sender, controlCenterSender);
    return getReactionMappingSnapshot();
  });
  ipcMain.handle("openpets:control-center:get-pets-snapshot", (event) => handleControlCenterGetPetsSnapshotRequest(event.sender, getAuthorizedControlCenterSender(event), getAppStateSnapshot));
  ipcMain.handle("openpets:control-center:get-pet-catalog-snapshot", (event) => handleControlCenterGetPetCatalogSnapshotRequest(event.sender, getAuthorizedControlCenterSender(event), getCatalogUiState));
  ipcMain.handle("openpets:control-center:get-pet-catalog-page", (event, page: unknown) => handleControlCenterGetPetCatalogPageRequest(event.sender, getAuthorizedControlCenterSender(event), page, getCatalogPageUiState));
  ipcMain.handle("openpets:control-center:get-pet-catalog-search", (event) => handleControlCenterGetPetCatalogSearchRequest(event.sender, getAuthorizedControlCenterSender(event), getCatalogSearchUiState));
  ipcMain.handle("openpets:control-center:get-codex-pets-snapshot", (event) => handleControlCenterGetCodexPetsSnapshotRequest(event.sender, getAuthorizedControlCenterSender(event), getCodexPetsUiState));
  ipcMain.handle("openpets:control-center:set-launch-at-login", (event, enabled: unknown) => {
    return handleControlCenterSetLaunchAtLoginRequest(event.sender, getAuthorizedControlCenterSender(event), enabled, {
      isSupported: isLaunchAtLoginSupported,
      setLoginItemSettings: (settings) => app.setLoginItemSettings(settings),
      getSettingsSnapshot,
    });
  });
  ipcMain.handle("openpets:control-center:set-pet-scale", (event, value: unknown) => {
    return handleControlCenterSetPetScaleRequest(event.sender, getAuthorizedControlCenterSender(event), value, {
      petScaleOptions,
      updatePreferences,
      refreshDefaultPetContent,
      refreshAgentPetContent,
      getSettingsSnapshot,
    });
  });
  ipcMain.handle("openpets:control-center:reset-default-pet-position", (event) => {
    return handleControlCenterResetDefaultPetPositionRequest(event.sender, getAuthorizedControlCenterSender(event), {
      resetDefaultPetToInitialPosition,
      getSettingsSnapshot,
    });
  });
  ipcMain.handle("openpets:control-center:set-reaction-animation-override", async (event, reactionId: unknown, animationId: unknown) => {
    const controlCenterSender = getAuthorizedControlCenterSender(event);
    assertAuthorizedControlCenterSender(event.sender, controlCenterSender);
    return handleControlCenterSetReactionAnimationOverrideRequest(event.sender, controlCenterSender, reactionId, animationId, await getReactionMappingMutationDependencies());
  });
  ipcMain.handle("openpets:control-center:reset-reaction-animation-override", async (event, reactionId: unknown) => {
    const controlCenterSender = getAuthorizedControlCenterSender(event);
    assertAuthorizedControlCenterSender(event.sender, controlCenterSender);
    return handleControlCenterResetReactionAnimationOverrideRequest(event.sender, controlCenterSender, reactionId, await getReactionMappingMutationDependencies());
  });
  ipcMain.handle("openpets:control-center:reset-reaction-animation-overrides", async (event) => {
    const controlCenterSender = getAuthorizedControlCenterSender(event);
    assertAuthorizedControlCenterSender(event.sender, controlCenterSender);
    return handleControlCenterResetReactionAnimationOverridesRequest(event.sender, controlCenterSender, await getReactionMappingMutationDependencies());
  });
  ipcMain.handle("openpets:control-center:check-for-updates", async (event) => {
    const controlCenterSender = getAuthorizedControlCenterSender(event);
    return handleControlCenterCheckForUpdatesRequest(event.sender, controlCenterSender, {
      checkForGitHubReleaseUpdate,
      refreshTrayMenu: asyncRefreshTrayMenu,
      getSettingsSnapshot,
    });
  });
  ipcMain.handle("openpets:control-center:open-update-release-page", async (event) => {
    return handleControlCenterOpenUpdateReleasePageRequest(event.sender, getAuthorizedControlCenterSender(event), { getUpdateStatus, openUpdateReleasePage });
  });
  ipcMain.handle("openpets:control-center:set-default-pet", (event, petId: unknown) => handleControlCenterPetMutationRequest(event.sender, getAuthorizedControlCenterSender(event), petId, { writePet: setDefaultInstalledPet, refreshDefaultPetContent, recoverDefaultPetMouseInterop, scheduleDelayedRecoverDefaultPetMouseInterop, refreshTrayMenu: asyncRefreshTrayMenu }, { allowBuiltIn: true }));
  ipcMain.handle("openpets:control-center:install-catalog-pet", (event, petId: unknown) => handleControlCenterPetMutationRequest(event.sender, getAuthorizedControlCenterSender(event), petId, { writePet: installPet, refreshTrayMenu: asyncRefreshTrayMenu }));
  ipcMain.handle("openpets:control-center:import-codex-pet", (event, petId: unknown) => handleControlCenterPetMutationRequest(event.sender, getAuthorizedControlCenterSender(event), petId, { writePet: importCodexPet, refreshTrayMenu: asyncRefreshTrayMenu }));
  ipcMain.handle("openpets:control-center:remove-installed-pet", (event, petId: unknown) => handleControlCenterPetMutationRequest(event.sender, getAuthorizedControlCenterSender(event), petId, { writePet: removePet, refreshDefaultPetContent, refreshTrayMenu: asyncRefreshTrayMenu }));
  ipcMain.handle("openpets:control-center:get-agent-setup-snapshot", (event, selectedPetId: unknown, commandMode: unknown) => handleControlCenterGetAgentSetupSnapshotRequest(event.sender, getAuthorizedControlCenterSender(event), selectedPetId, commandMode, getAgentSetupSnapshot));
  ipcMain.handle("openpets:control-center:run-agent-setup-action", (event, action: unknown, selectedPetId: unknown, commandMode: unknown) => handleControlCenterRunAgentSetupActionRequest(event.sender, getAuthorizedControlCenterSender(event), action, selectedPetId, commandMode, runAgentSetupAction));
  ipcMain.handle("openpets:control-center:update-agent-setup-command-paths", (event, patch: unknown) => handleControlCenterUpdateAgentSetupCommandPathsRequest(event.sender, getAuthorizedControlCenterSender(event), patch, updateAgentSetupCommandPaths));
  ipcMain.handle("openpets:control-center:get-plugins-snapshot", (event) => handleControlCenterGetPluginsSnapshotRequest(event.sender, getAuthorizedControlCenterSender(event), () => getPluginService().getSnapshot()));
  ipcMain.handle("openpets:control-center:set-plugin-enabled", (event, id: unknown, enabled: unknown) => handleControlCenterPluginEnabledRequest(event.sender, getAuthorizedControlCenterSender(event), id, enabled, (pluginId, nextEnabled) => getPluginService().setEnabled(pluginId, nextEnabled)));
  ipcMain.handle("openpets:control-center:save-plugin-config", (event, id: unknown, config: unknown) => handleControlCenterPluginConfigRequest(event.sender, getAuthorizedControlCenterSender(event), id, config, (pluginId, nextConfig) => getPluginService().saveConfig(pluginId, nextConfig)));
  ipcMain.handle("openpets:control-center:reload-plugin", (event, id: unknown) => handleControlCenterPluginIdMutationRequest(event.sender, getAuthorizedControlCenterSender(event), id, (pluginId) => getPluginService().reload(pluginId)));
  ipcMain.handle("openpets:control-center:execute-plugin-command", (event, id: unknown, commandId: unknown) => handleControlCenterPluginCommandRequest(event.sender, getAuthorizedControlCenterSender(event), id, commandId, (pluginId, nextCommandId) => getPluginService().executeCommand(pluginId, nextCommandId)));
  ipcMain.handle("openpets:control-center:load-local-plugin", (event) => handleControlCenterLoadLocalPluginRequest(event.sender, getAuthorizedControlCenterSender(event), () => getPluginService().loadLocal()));
  ipcMain.handle("openpets:control-center:get-plugin-catalog-snapshot", (event, refresh: unknown) => handleControlCenterGetPluginCatalogSnapshotRequest(event.sender, getAuthorizedControlCenterSender(event), refresh, (nextRefresh) => getPluginService().getCatalogSnapshot(nextRefresh)));
  ipcMain.handle("openpets:control-center:install-catalog-plugin", (event, id: unknown) => handleControlCenterPluginIdMutationRequest(event.sender, getAuthorizedControlCenterSender(event), id, (pluginId) => getPluginService().installCatalog(pluginId)));
  ipcMain.handle("openpets:control-center:update-catalog-plugin", (event, id: unknown) => handleControlCenterPluginIdMutationRequest(event.sender, getAuthorizedControlCenterSender(event), id, (pluginId) => getPluginService().updateCatalog(pluginId)));
  ipcMain.handle("openpets:control-center:uninstall-plugin", (event, id: unknown) => handleControlCenterPluginIdMutationRequest(event.sender, getAuthorizedControlCenterSender(event), id, (pluginId) => getPluginService().uninstall(pluginId)));
}

function scheduleDelayedRecoverDefaultPetMouseInterop(reason: string, delayMs: number): void {
  setTimeout(() => recoverDefaultPetMouseInterop(reason), delayMs).unref?.();
}

async function asyncRefreshTrayMenu(): Promise<void> {
  const { refreshTrayMenu } = await import("./tray.js");
  refreshTrayMenu();
}

function getDashboardSnapshot(): ControlCenterDashboardSnapshot {
  return buildControlCenterDashboardSnapshot(getSnapshotDependencies());
}

function getSettingsSnapshot(): ControlCenterSettingsSnapshot {
  return buildControlCenterSettingsSnapshot(getSnapshotDependencies());
}

async function getReactionMappingSnapshot(): Promise<ControlCenterReactionMappingSnapshot> {
  return buildControlCenterReactionMappingSnapshot(await getSnapshotDependenciesWithPreview());
}

function getSnapshotDependencies(): ControlCenterSnapshotDependencies {
  return {
    appVersion: app.getVersion(),
    state: getAppStateSnapshot(),
    updateStatus: getUpdateStatus(),
    launchAtLogin: getLaunchAtLoginState(),
    petScaleOptions,
    reactionAnimationMetadata,
    selectableAnimationMetadata,
    defaultPetSprite,
  };
}

async function getSnapshotDependenciesWithPreview(): Promise<ControlCenterSnapshotDependencies> {
  const preview = await getDefaultPetPreviewSpriteInfo();
  return { ...getSnapshotDependencies(), defaultPetSprite: { ...defaultPetSprite, previewUrl: preview.url, version: preview.version } };
}

async function getReactionMappingMutationDependencies(): Promise<ControlCenterReactionMappingMutationDependencies> {
  const preview = await getDefaultPetPreviewSpriteInfo();
  return {
    state: getAppStateSnapshot(),
    reactionAnimationMetadata,
    selectableAnimationMetadata,
    updatePreferences,
    refreshDefaultPetContent,
    refreshAgentPetContent,
    getSettingsSnapshot,
    getReactionMappingSnapshot: () => buildControlCenterReactionMappingSnapshot({
      ...getSnapshotDependencies(),
      defaultPetSprite: { ...defaultPetSprite, previewUrl: preview.url, version: preview.version },
    }),
  };
}

function getLaunchAtLoginState(): { supported: boolean; enabled: boolean } {
  if (!isLaunchAtLoginSupported()) return { supported: false, enabled: false };
  return { supported: true, enabled: app.getLoginItemSettings().openAtLogin };
}

function isLaunchAtLoginSupported(): boolean {
  return process.platform === "darwin" || process.platform === "win32";
}

function assertControlCenterSender(event: IpcMainInvokeEvent): void {
  assertAuthorizedControlCenterSender(event.sender, getAuthorizedControlCenterSender(event));
}

function getAuthorizedControlCenterSender(event: IpcMainInvokeEvent): WebContents | null {
  return isControlCenterWebContents(event.sender) ? event.sender : null;
}
