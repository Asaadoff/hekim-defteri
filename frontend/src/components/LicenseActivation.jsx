import React, { useState, useEffect } from 'react';
import { FiKey, FiCopy, FiCheck, FiAlertCircle, FiClock } from 'react-icons/fi';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function LicenseActivation({ onActivated }) {
  const [licenseKey, setLicenseKey] = useState('');
  const [hardwareId, setHardwareId] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkLicenseStatus();
  }, []);

  const checkLicenseStatus = async () => {
    try {
      setLoading(true);
      const [statusRes, hwRes] = await Promise.all([
        axios.get(`${API_URL}/license/status`),
        axios.get(`${API_URL}/license/hardware-id`)
      ]);
      
      setStatus(statusRes.data);
      setHardwareId(hwRes.data.hardwareId);
      
      // If license is valid, notify parent
      if (statusRes.data.valid && statusRes.data.type === 'licensed') {
        onActivated();
      }
    } catch (err) {
      setError('Lisenziya yoxlanarkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setError('Lisenziya kodunu daxil edin');
      return;
    }

    try {
      setActivating(true);
      setError('');
      
      const response = await axios.post(`${API_URL}/license/activate`, {
        licenseKey: licenseKey.trim().toUpperCase()
      });
      
      if (response.data.success) {
        onActivated();
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Aktivasiya xətası');
    } finally {
      setActivating(false);
    }
  };

  const handleStartTrial = () => {
    if (status?.valid && status?.type === 'trial') {
      onActivated();
    }
  };

  const copyHardwareId = () => {
    navigator.clipboard.writeText(hardwareId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatLicenseKey = (value) => {
    // Just uppercase and trim, keep dashes and numbers
    return value.toUpperCase().trim();
  };

  if (loading) {
    return (
      <div className="license-screen">
        <div className="license-card">
          <div className="license-loading">
            <div className="spinner"></div>
            <p>Yüklənir...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="license-screen">
      <div className="license-card">
        <div className="license-header">
          <FiKey className="license-icon" />
          <h1>Həkim dəftəri</h1>
          <p>Lisenziya Aktivasiyası</p>
        </div>

        {/* Hardware ID Section */}
        <div className="license-hardware">
          <label>Cihaz ID (Bu kodu satıcıya göndərin)</label>
          <div className="hardware-id-box">
            <span>{hardwareId}</span>
            <button onClick={copyHardwareId} title="Kopyala">
              {copied ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>

        {/* Trial Status */}
        {status?.type === 'trial' && status?.valid && (
          <div className="license-trial-info">
            <FiClock />
            <span>Trial müddəti: {status.daysLeft} gün qaldı</span>
          </div>
        )}

        {status?.type === 'trial_expired' && (
          <div className="license-expired">
            <FiAlertCircle />
            <span>Trial müddəti bitdi!</span>
          </div>
        )}

        {/* License Key Input */}
        <div className="license-input-group">
          <label>Lisenziya Kodu</label>
          <input
            type="text"
            placeholder="HEKIM-XXXXX-XXXXX-XXXXX-XXXXX"
            value={licenseKey}
            onChange={(e) => setLicenseKey(formatLicenseKey(e.target.value))}
            maxLength={42}
          />
        </div>

        {error && (
          <div className="license-error">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="license-buttons">
          <button 
            className="btn-activate"
            onClick={handleActivate}
            disabled={activating || !licenseKey.trim()}
          >
            {activating ? 'Aktivləşdirilir...' : 'Aktivləşdir'}
          </button>
          
          {status?.valid && status?.type === 'trial' && (
            <button 
              className="btn-trial"
              onClick={handleStartTrial}
            >
              Trial ilə davam et ({status.daysLeft} gün)
            </button>
          )}
        </div>

        {/* Contact */}
        <div className="license-contact">
          <p>Lisenziya almaq üçün əlaqə:</p>
          <p>+994 77 310 0313 | doctor.admiin@gmail.com</p>
        </div>
      </div>
    </div>
  );
}

export default LicenseActivation;
