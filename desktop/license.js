const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// License file path - separate from main database
const getLicensePath = () => {
  const appData = process.env.APPDATA || process.env.HOME || __dirname;
  const folder = path.join(appData, 'HekimBorcDefteri');
  
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
  
  return path.join(folder, '.license');
};

// Generate unique hardware ID based on system info
const getHardwareId = () => {
  const cpus = os.cpus();
  const networkInterfaces = os.networkInterfaces();
  
  // Get first non-internal MAC address
  let mac = '';
  for (const iface of Object.values(networkInterfaces)) {
    for (const config of iface) {
      if (!config.internal && config.mac && config.mac !== '00:00:00:00:00:00') {
        mac = config.mac;
        break;
      }
    }
    if (mac) break;
  }
  
  // Combine system info for unique ID
  const systemInfo = [
    os.hostname(),
    os.platform(),
    cpus[0]?.model || 'cpu',
    os.totalmem().toString(),
    mac
  ].join('|');
  
  // Create hash of system info
  const hash = crypto.createHash('sha256').update(systemInfo).digest('hex');
  
  // Format as readable ID (first 16 chars, grouped)
  const shortHash = hash.substring(0, 16).toUpperCase();
  return `${shortHash.substring(0, 4)}-${shortHash.substring(4, 8)}-${shortHash.substring(8, 12)}-${shortHash.substring(12, 16)}`;
};

// Secret key for license validation (keep this secret!)
const SECRET_KEY = 'HekimDefteri2026SecretKey!@#';

// Generate license key from hardware ID (used by admin tool)
const generateLicenseKey = (hardwareId, type = 'lifetime') => {
  const data = `${hardwareId}|${type}|${SECRET_KEY}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  
  // Format as license key
  const key = hash.substring(0, 20).toUpperCase();
  return `HEKIM-${key.substring(0, 5)}-${key.substring(5, 10)}-${key.substring(10, 15)}-${key.substring(15, 20)}`;
};

// Validate license key against hardware ID
const validateLicenseKey = (licenseKey, hardwareId) => {
  // Generate expected key for this hardware
  const expectedKey = generateLicenseKey(hardwareId, 'lifetime');
  return licenseKey === expectedKey;
};

// Load license data
const loadLicense = () => {
  try {
    const licensePath = getLicensePath();
    if (fs.existsSync(licensePath)) {
      const encrypted = fs.readFileSync(licensePath, 'utf8');
      const decrypted = decrypt(encrypted);
      return JSON.parse(decrypted);
    }
  } catch (err) {
    console.error('License load error:', err.message);
  }
  return null;
};

// Save license data
const saveLicense = (licenseData) => {
  try {
    const licensePath = getLicensePath();
    const encrypted = encrypt(JSON.stringify(licenseData));
    fs.writeFileSync(licensePath, encrypted, 'utf8');
    return true;
  } catch (err) {
    console.error('License save error:', err.message);
    return false;
  }
};

// Simple encryption for license file
const encrypt = (text) => {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    crypto.createHash('sha256').update(SECRET_KEY).digest(),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

const decrypt = (encrypted) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    crypto.createHash('sha256').update(SECRET_KEY).digest(),
    Buffer.alloc(16, 0)
  );
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

// Check license status
const checkLicense = () => {
  const hardwareId = getHardwareId();
  const license = loadLicense();
  
  if (!license) {
    // No license - check trial
    return checkTrialStatus();
  }
  
  // Validate license key matches this hardware
  if (!validateLicenseKey(license.key, hardwareId)) {
    return {
      valid: false,
      type: 'invalid',
      message: 'Lisenziya bu kompüter üçün etibarlı deyil',
      hardwareId
    };
  }
  
  return {
    valid: true,
    type: 'licensed',
    message: 'Lisenziya aktivdir',
    activatedAt: license.activatedAt,
    hardwareId
  };
};

// Trial management
const TRIAL_DAYS = 14;

const getTrialPath = () => {
  const appData = process.env.APPDATA || process.env.HOME || __dirname;
  const folder = path.join(appData, 'HekimBorcDefteri');
  return path.join(folder, '.trial');
};

const checkTrialStatus = () => {
  const hardwareId = getHardwareId();
  const trialPath = getTrialPath();
  
  try {
    if (!fs.existsSync(trialPath)) {
      // Start new trial
      const trialData = {
        startDate: new Date().toISOString(),
        hardwareId
      };
      const encrypted = encrypt(JSON.stringify(trialData));
      fs.writeFileSync(trialPath, encrypted, 'utf8');
      
      return {
        valid: true,
        type: 'trial',
        daysLeft: TRIAL_DAYS,
        message: `Trial başladı - ${TRIAL_DAYS} gün qaldı`,
        hardwareId
      };
    }
    
    // Check existing trial
    const encrypted = fs.readFileSync(trialPath, 'utf8');
    const trialData = JSON.parse(decrypt(encrypted));
    const startDate = new Date(trialData.startDate);
    const now = new Date();
    const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysLeft = TRIAL_DAYS - daysPassed;
    
    if (daysLeft <= 0) {
      return {
        valid: false,
        type: 'trial_expired',
        daysLeft: 0,
        message: 'Trial müddəti bitdi. Zəhmət olmasa lisenziya alın.',
        hardwareId
      };
    }
    
    return {
      valid: true,
      type: 'trial',
      daysLeft,
      message: `Trial - ${daysLeft} gün qaldı`,
      hardwareId
    };
    
  } catch (err) {
    console.error('Trial check error:', err.message);
    return {
      valid: false,
      type: 'error',
      message: 'Trial yoxlanarkən xəta',
      hardwareId
    };
  }
};

// Activate license
const activateLicense = (licenseKey) => {
  const hardwareId = getHardwareId();
  
  // Validate key
  if (!validateLicenseKey(licenseKey, hardwareId)) {
    return {
      success: false,
      message: 'Lisenziya kodu yanlışdır və ya bu kompüter üçün deyil'
    };
  }
  
  // Save license
  const licenseData = {
    key: licenseKey,
    hardwareId,
    activatedAt: new Date().toISOString(),
    type: 'lifetime'
  };
  
  if (saveLicense(licenseData)) {
    return {
      success: true,
      message: 'Lisenziya uğurla aktivləşdirildi!'
    };
  }
  
  return {
    success: false,
    message: 'Lisenziya saxlanarkən xəta baş verdi'
  };
};

module.exports = {
  getHardwareId,
  generateLicenseKey,
  validateLicenseKey,
  checkLicense,
  activateLicense,
  loadLicense,
  saveLicense
};
