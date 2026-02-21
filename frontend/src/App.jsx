import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiDollarSign, FiBarChart2, FiBell, FiCalendar, FiMenu, FiX, FiMail, FiPhone, FiSettings } from 'react-icons/fi';
import axios from 'axios';

import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import ReceptionTransactions from './pages/ReceptionTransactions';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Reminders from './pages/Reminders';
import Settings from './pages/Settings';
import SearchBar from './components/SearchBar';
import LicenseActivation from './components/LicenseActivation';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [licenseValid, setLicenseValid] = useState(null);
  const [licenseInfo, setLicenseInfo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async (retryCount = 0) => {
    try {
      console.log('Checking license... attempt:', retryCount + 1);
      const response = await axios.get(`${API_URL}/license/status`);
      console.log('License response:', response.data);
      setLicenseInfo(response.data);
      
      // Allow access if license is valid (including trial)
      if (response.data.valid) {
        console.log('License valid, allowing access');
        setLicenseValid(true);
      } else {
        console.log('License not valid:', response.data.type);
        // Expired - show activation screen
        setLicenseValid(false);
      }
    } catch (err) {
      console.error('License check error:', err);
      // Retry up to 5 times with 1 second delay
      if (retryCount < 5) {
        console.log('Retrying license check in 1 second...');
        setTimeout(() => checkLicense(retryCount + 1), 1000);
      } else {
        // If can't check license after retries, show activation screen
        setLicenseValid(false);
      }
    }
  };

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    setSidebarOpen(false);
  };

  // Show license activation screen if not valid
  if (licenseValid === null) {
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

  if (licenseValid === false) {
    return <LicenseActivation onActivated={() => setLicenseValid(true)} />;
  }

  return (
    <div className="app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
        <h1 className="mobile-title">Həkim Dəftəri</h1>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1>Həkim Dəftəri</h1>
          <p>Maliyyə idarəetmə sistemi</p>
        </div>
        
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <FiHome /> Ana Səhifə
          </NavLink>
          <NavLink to="/reception" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <FiCalendar /> Qəbul və Əməliyyatlar
          </NavLink>
          <NavLink to="/patients" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <FiUsers /> Xəstələr
          </NavLink>
          <NavLink to="/payments" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <FiDollarSign /> Ödənişlər
          </NavLink>
          <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <FiBarChart2 /> Hesabatlar
          </NavLink>
          <NavLink to="/reminders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <FiBell /> Xatırlatmalar
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} onClick={handleNavClick}>
            <FiSettings /> Ayarlar
          </NavLink>
        </nav>
        
        <div className="sidebar-contact">
          <div className="sidebar-contact-title">Əlaqə</div>
          <div className="sidebar-contact-item">
            <FiPhone /> +994 77 310 0313
          </div>
          <div className="sidebar-contact-item">
            <FiMail /> doctor.admiin@gmail.com
          </div>
        </div>
      </aside>
      
      <main className="main-content">
        <SearchBar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reception" element={<ReceptionTransactions />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        
        <footer className="app-footer">
          <p>&copy; 2026 Həkim Dəftəri. Bütün hüquqlar qorunur.</p>
          <p className="footer-contact">Hazırladı - Ümid Əsədov</p>
        </footer>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
