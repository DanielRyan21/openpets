import { app, BrowserWindow, type WebContents } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let controlCenterWindow: BrowserWindow | null = null;

type ControlCenterRoute = "pets" | "integrations" | "plugins" | "settings" | "onboarding";

export function openControlCenterWindow(): BrowserWindow {
  return openControlCenterWindowRoute();
}

export function openControlCenterPetsWindow(): BrowserWindow {
  return openControlCenterWindowRoute("pets");
}

export function openControlCenterIntegrationsWindow(): BrowserWindow {
  return openControlCenterWindowRoute("integrations");
}

export function openControlCenterPluginsWindow(): BrowserWindow {
  return openControlCenterWindowRoute("plugins");
}

export function openControlCenterSettingsWindow(): BrowserWindow {
  return openControlCenterWindowRoute("settings");
}

export function openControlCenterOnboardingWindow(): BrowserWindow {
  return openControlCenterWindowRoute("onboarding");
}

export function focusControlCenterWindow(): void {
  if (controlCenterWindow && !controlCenterWindow.isDestroyed()) {
    controlCenterWindow.show();
    controlCenterWindow.focus();
  }
}

function openControlCenterWindowRoute(route?: ControlCenterRoute): BrowserWindow {
  if (controlCenterWindow && !controlCenterWindow.isDestroyed()) {
    controlCenterWindow.show();
    controlCenterWindow.focus();
    if (route) setControlCenterRoute(controlCenterWindow, route);
    return controlCenterWindow;
  }

  const window = new BrowserWindow({
    width: 980,
    height: 720,
    minWidth: 760,
    minHeight: 560,
    title: "OpenPets Control Center",
    backgroundColor: "#0b1020",
    webPreferences: {
      preload: getControlCenterPreloadPath(),
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  controlCenterWindow = window;
  installNavigationGuards(window);
  window.once("closed", () => {
    if (controlCenterWindow === window) controlCenterWindow = null;
  });

  void loadControlCenter(window, route);
  return window;
}

export function isControlCenterWebContents(webContents: WebContents): boolean {
  return Boolean(controlCenterWindow && !controlCenterWindow.isDestroyed() && controlCenterWindow.webContents === webContents);
}

function getControlCenterPreloadPath(): string {
  return join(app.getAppPath(), "control-center-preload.cjs");
}

async function loadControlCenter(window: BrowserWindow, route?: ControlCenterRoute): Promise<void> {
  const devUrl = getControlCenterDevUrl();
  if (devUrl) {
    await window.loadURL(withControlCenterHash(devUrl, route));
    return;
  }
  const distDir = dirname(fileURLToPath(import.meta.url));
  await window.loadFile(join(distDir, "renderer", "control-center", "index.html"), route ? { hash: route } : undefined);
}

function setControlCenterRoute(window: BrowserWindow, route: ControlCenterRoute): void {
  void window.webContents.executeJavaScript(`window.location.hash = ${JSON.stringify(route)}`, true);
}

function withControlCenterHash(value: string, route?: ControlCenterRoute): string {
  if (!route) return value;
  const url = new URL(value);
  url.hash = route;
  return url.toString();
}

function getControlCenterDevUrl(): string | null {
  if (app.isPackaged) return null;

  const devUrl = process.env.OPENPETS_CONTROL_CENTER_DEV_URL;
  if (!devUrl) return null;

  return isLoopbackControlCenterDevUrl(devUrl) ? devUrl : null;
}

function isLoopbackControlCenterDevUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && isLoopbackHostname(url.hostname);
  } catch {
    return false;
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function installNavigationGuards(window: BrowserWindow): void {
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  window.webContents.on("will-redirect", (event) => event.preventDefault());
}
