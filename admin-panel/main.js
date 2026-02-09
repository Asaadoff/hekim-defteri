const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow;

// Data storage path
const getDataPath = () => {
  const appData = process.env.APPDATA || process.env.HOME || __dirname;
  const folder = path.join(appData, 'HekimAdminPanel');
  
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  
  return path.join(folder, 'admin-data.json');
};

// Load data
const loadData = () => {
  const dataPath = getDataPath();
  if (fs.existsSync(dataPath)) {
    try {
      return JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch {
      return { customers: [], licenses: [], settings: {} };
    }
  }
  return { customers: [], licenses: [], settings: {} };
};

// Save data
const saveData = (data) => {
  fs.writeFileSync(getDataPath(), JSON.stringify(data, null, 2), 'utf8');
};

// Secret key - MUST MATCH license.js in desktop app!
const SECRET_KEY = 'HekimDefteri2026SecretKey!@#';

// Generate license key
const generateLicenseKey = (hardwareId) => {
  const data = `${hardwareId}|lifetime|${SECRET_KEY}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  const key = hash.substring(0, 20).toUpperCase();
  return `HEKIM-${key.substring(0, 5)}-${key.substring(5, 10)}-${key.substring(10, 15)}-${key.substring(15, 20)}`;
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    backgroundColor: '#1a1a2e',
    title: 'Həkim Admin Panel'
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-data', () => {
  return loadData();
});

ipcMain.handle('save-data', (event, data) => {
  saveData(data);
  return { success: true };
});

ipcMain.handle('generate-license', (event, hardwareId) => {
  return generateLicenseKey(hardwareId);
});

ipcMain.handle('add-customer', (event, customer) => {
  const data = loadData();
  customer.id = Date.now().toString();
  customer.createdAt = new Date().toISOString();
  data.customers.push(customer);
  saveData(data);
  return { success: true, customer };
});

ipcMain.handle('update-customer', (event, customer) => {
  const data = loadData();
  const index = data.customers.findIndex(c => c.id === customer.id);
  if (index !== -1) {
    data.customers[index] = { ...data.customers[index], ...customer };
    saveData(data);
    return { success: true };
  }
  return { success: false, error: 'Müştəri tapılmadı' };
});

ipcMain.handle('delete-customer', (event, customerId) => {
  const data = loadData();
  data.customers = data.customers.filter(c => c.id !== customerId);
  saveData(data);
  return { success: true };
});

ipcMain.handle('add-license', (event, license) => {
  const data = loadData();
  license.id = Date.now().toString();
  license.createdAt = new Date().toISOString();
  data.licenses.push(license);
  saveData(data);
  return { success: true, license };
});

ipcMain.handle('export-data', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Məlumatları Export Et',
    defaultPath: `hekim-admin-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  
  if (!result.canceled && result.filePath) {
    const data = loadData();
    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
    return { success: true, path: result.filePath };
  }
  return { success: false };
});

ipcMain.handle('import-data', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Məlumatları Import Et',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    try {
      const importedData = JSON.parse(fs.readFileSync(result.filePaths[0], 'utf8'));
      saveData(importedData);
      return { success: true, data: importedData };
    } catch (err) {
      return { success: false, error: 'Fayl oxuna bilmədi' };
    }
  }
  return { success: false };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
