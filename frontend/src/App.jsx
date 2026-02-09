import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { FiHome, FiUsers, FiDollarSign, FiBarChart2, FiBell, FiCalendar, FiMenu, FiX, FiMail, FiPhone } from 'react-icons/fi';

import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import ReceptionTransactions from './pages/ReceptionTransactions';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Reminders from './pages/Reminders';
import SearchBar from './components/SearchBar';

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation (mobile)
  const handleNavClick = () => {
    setSidebarOpen(false);
  };

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
          <p>Borc və Nisyə İdarəetmə</p>
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
        </Routes>
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
