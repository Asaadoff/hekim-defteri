import React, { useState, useEffect } from 'react';
import { FiDownload, FiUpload, FiRefreshCw, FiCheck, FiAlertCircle, FiClock, FiDatabase, FiInfo, FiAlertTriangle } from 'react-icons/fi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function Settings() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [appVersion, setAppVersion] = useState('');
  const [lastBackupDate, setLastBackupDate] = useState(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  useEffect(() => {
    loadBackups();
    loadAppVersion();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await axios.get(`${API_URL}/backups`);
      setBackups(response.data);
      
      // Get last backup date
      if (response.data.length > 0) {
        setLastBackupDate(new Date(response.data[0].date));
      }
    } catch (error) {
      console.error('Backup yüklənmədi:', error);
    }
  };

  const loadAppVersion = async () => {
    try {
      const response = await axios.get(`${API_URL}/app/version`);
      setAppVersion(response.data.version);
    } catch (error) {
      setAppVersion('1.0.0');
    }
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const response = await axios.post(`${API_URL}/backups/create`);
      setMessage({ type: 'success', text: 'Backup uğurla yaradıldı!' });
      await loadBackups(); // await əlavə edildi
    } catch (error) {
      setMessage({ type: 'error', text: 'Backup yaradıla bilmədi' });
    } finally {
      setLoading(false);
    }
  };

  const restoreBackup = async (fileName) => {
    setSelectedBackup(fileName);
    setShowRestoreConfirm(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;
    
    setShowRestoreConfirm(false);
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await axios.post(`${API_URL}/backups/restore`, { fileName: selectedBackup });
      setMessage({ type: 'success', text: 'Məlumatlar uğurla bərpa edildi! Səhifəni yeniləyin.' });
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Bərpa zamanı xəta baş verdi' });
    } finally {
      setLoading(false);
      setSelectedBackup(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('az-AZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getDaysSinceBackup = () => {
    if (!lastBackupDate) return null;
    const now = new Date();
    const diffTime = Math.abs(now - lastBackupDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceBackup = getDaysSinceBackup();

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Ayarlar</h1>
      </div>

      {/* Backup Warning */}
      {daysSinceBackup !== null && daysSinceBackup >= 7 && (
        <div className="backup-warning">
          <FiAlertCircle />
          <div>
            <strong>Xatırlatma:</strong> Son backup {daysSinceBackup} gün əvvəl alınıb. 
            Məlumatlarınızı qorumaq üçün backup almağı tövsiyə edirik.
          </div>
        </div>
      )}

      {/* Message */}
      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.type === 'success' ? <FiCheck /> : <FiAlertCircle />}
          {message.text}
        </div>
      )}

      {/* Backup Section */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <FiDatabase />
          </div>
          <div>
            <h2>Məlumat Yedəkləmə</h2>
            <p>Xəstə, əməliyyat və bütün məlumatlarınızı yedəkləyin</p>
          </div>
        </div>

        <div className="backup-status">
          <div className="backup-status-item">
            <FiClock />
            <span>Son backup:</span>
            <strong>{lastBackupDate ? formatDate(lastBackupDate) : 'Heç backup alınmayıb'}</strong>
          </div>
          <div className="backup-status-item">
            <FiDatabase />
            <span>Backup sayı:</span>
            <strong>{backups.length}</strong>
          </div>
        </div>

        <div className="backup-actions">
          <button 
            className="btn btn-primary btn-lg"
            onClick={createBackup}
            disabled={loading}
          >
            <FiDownload />
            {loading ? 'Yaradılır...' : 'Backup Al'}
          </button>
          
          <button 
            className="btn btn-secondary btn-lg"
            onClick={loadBackups}
            disabled={loading}
          >
            <FiRefreshCw />
            Yenilə
          </button>
        </div>

        {/* Last Backup */}
        {backups.length > 0 && (
          <div className="last-backup-section">
            <h3>Son Backup</h3>
            <div className="last-backup-card">
              <div className="last-backup-info">
                <div className="last-backup-date">
                  <FiClock />
                  <span>{formatDate(backups[0].date)}</span>
                </div>
                <div className="last-backup-size">
                  <FiDatabase />
                  <span>{formatFileSize(backups[0].size)}</span>
                </div>
              </div>
              <button
                className="btn btn-outline"
                onClick={() => restoreBackup(backups[0].fileName)}
                disabled={loading}
              >
                <FiUpload />
                Bərpa Et
              </button>
            </div>
          </div>
        )}

        <div className="backup-info">
          <FiInfo />
          <div>
            <strong>Qeyd:</strong> Backup faylları avtomatik olaraq kompüterinizdə saxlanılır. 
            Proqramı silsəniz belə, backup faylları silinmir. 
            Kompüter dəyişəndə backup faylını köçürə bilərsiniz.
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="settings-card">
        <div className="settings-card-header">
          <div className="settings-card-icon">
            <FiInfo />
          </div>
          <div>
            <h2>Proqram Haqqında</h2>
            <p>Həkim dəftəri</p>
          </div>
        </div>

        <div className="app-info">
          <div className="app-info-row">
            <span>Versiya:</span>
            <strong>v{appVersion}</strong>
          </div>
          <div className="app-info-row">
            <span>Hazırladı:</span>
            <strong>Ümid Əsədov</strong>
          </div>
          <div className="app-info-row">
            <span>Əlaqə:</span>
            <strong>+994 77 310 0313</strong>
          </div>
          <div className="app-info-row">
            <span>Email:</span>
            <strong>doctor.admiin@gmail.com</strong>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="modal-overlay">
          <div className="modal-content restore-modal">
            <div className="restore-modal-icon">
              <FiAlertTriangle />
            </div>
            <h3>Diqqət!</h3>
            <p className="restore-modal-desc">
              Backup-dan bərpa etmək istəyirsiniz. Bu əməliyyat mövcud bütün məlumatlarınızı silib, 
              backup-dakı məlumatlarla əvəz edəcək.
            </p>
            <div className="restore-modal-info">
              <FiInfo />
              <div>
                <strong>Mühüm:</strong> Bu əməliyyat geri alına bilməz. Əgər hazırkı məlumatlarınızı 
                saxlamaq istəyirsinizsə, əvvəlcə yeni backup alın.
              </div>
            </div>
            <div className="restore-modal-buttons">
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setSelectedBackup(null);
                }}
              >
                Ləğv et
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmRestore}
              >
                Bəli, Bərpa Et
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
