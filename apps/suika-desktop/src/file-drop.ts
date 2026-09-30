import { ipcRenderer, webUtils } from 'electron';

const isSuikaFile = (file: File) => file.name.toLowerCase().endsWith('.suika');

/**
 * Opens dropped .suika files in tabs. Other dropped files that no page
 * handler takes (the canvas imports SVG itself) are ignored rather than
 * letting the page navigate to them.
 */
export const handleFileDrops = () => {
  window.addEventListener('dragover', (event) => {
    if (event.dataTransfer?.types.includes('Files')) event.preventDefault();
  });
  window.addEventListener('drop', (event) => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();

    const filePaths = [...event.dataTransfer.files]
      .filter(isSuikaFile)
      .map((file) => webUtils.getPathForFile(file))
      .filter(Boolean);
    if (filePaths.length > 0) {
      ipcRenderer.send('document:open-paths', filePaths);
    }
  });
};
