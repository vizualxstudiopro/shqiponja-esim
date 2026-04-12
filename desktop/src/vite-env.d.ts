/// <reference types="vite/client" />

interface ElectronAPI {
  platform: string;
  versions: {
    node: string;
    electron: string;
    chrome: string;
  };
}

interface Window {
  electronAPI?: ElectronAPI;
}
