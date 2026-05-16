const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
const DEV_PORT = process.env.VITE_DEV_PORT || 5173;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    title: "Shqiponja eSIM",
    icon: path.join(__dirname, "../src/assets/Logo/shqiponja esim App icon Android logo/1.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
    backgroundColor: "#09090b",
    show: false,
  });

  // Open external links in browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  win.once("ready-to-show", () => win.show());

  if (isDev) {
    win.loadURL(`http://localhost:${DEV_PORT}`);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
