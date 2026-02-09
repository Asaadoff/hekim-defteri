import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiUsers, FiDollarSign, FiAlertCircle, FiClock, FiTrendingUp } from 'react-icons/fi';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/api/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Dashboard yüklənmədi:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN'
    }).format(amount || 0);
  };

  if (loading) {
    return <div className="loading">Yüklənir...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Ana Səhifə</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          {(() => { const d = new Date(); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const weekday = d.toLocaleDateString('az-AZ',{weekday:'long'}); return `${day}.${month}.${year}, ${weekday.charAt(0).toUpperCase()+weekday.slice(1)}`; })()}
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FiUsers />
          </div>
          <div className="stat-value">{stats?.totalPatients || 0}</div>
          <div className="stat-label">Ümumi Xəstə</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <FiDollarSign />
          </div>
          <div className="stat-value">{formatMoney(stats?.totalDebt)}</div>
          <div className="stat-label">Ümumi Borc</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <FiTrendingUp />
          </div>
          <div className="stat-value">{formatMoney(stats?.totalPaid)}</div>
          <div className="stat-label">Ödənilmiş</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon warning">
            <FiClock />
          </div>
          <div className="stat-value">{stats?.pendingPayments || 0}</div>
          <div className="stat-label">Gözləyən Ödəniş</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <FiAlertCircle />
          </div>
          <div className="stat-value">{stats?.overduePayments || 0}</div>
          <div className="stat-label">Gecikmiş Ödəniş</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Son Əməliyyatlar</h3>
        </div>

        {/* Desktop table */}
        <div className="table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>Xəstə</th>
                <th>Təsvir</th>
                <th>Məbləğ</th>
                <th>Borc</th>
                <th>Status</th>
                <th>Tarix</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentTransactions?.length > 0 ? (
                stats.recentTransactions.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.ad} {t.soyad}</strong></td>
                    <td>{t.tesvir}</td>
                    <td className="money">{formatMoney(t.mebleg)}</td>
                    <td className="money negative">{formatMoney(t.borc_mebleg)}</td>
                    <td>
                      <span className={`badge badge-${
                        t.status === 'odenildi' ? 'success' : 
                        t.status === 'gecikdi' ? 'danger' : 
                        t.status === 'qismen_odenildi' ? 'info' : 'warning'
                      }`}>
                        {t.status === 'odenildi' ? 'Ödənildi' :
                         t.status === 'gecikdi' ? 'Gecikdi' :
                         t.status === 'qismen_odenildi' ? 'Qismən' : 'Gözləyir'}
                      </span>
                    </td>
                    <td>{(() => { const d = new Date(t.tarix); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const wd = d.toLocaleDateString('az-AZ',{weekday:'long'}); return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)}`; })()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    Hələ heç bir əməliyyat yoxdur
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card list */}
        <div className="mobile-only">
          {stats?.recentTransactions?.length > 0 ? (
            <div className="mobile-card-list">
              {stats.recentTransactions.map(t => (
                <div key={t.id} className="mobile-tx-card">
                  <div className="mobile-tx-top">
                    <strong>{t.ad} {t.soyad}</strong>
                    <span className={`badge badge-${
                      t.status === 'odenildi' ? 'success' : 
                      t.status === 'gecikdi' ? 'danger' : 
                      t.status === 'qismen_odenildi' ? 'info' : 'warning'
                    }`}>
                      {t.status === 'odenildi' ? 'Ödənildi' :
                       t.status === 'gecikdi' ? 'Gecikdi' :
                       t.status === 'qismen_odenildi' ? 'Qismən' : 'Gözləyir'}
                    </span>
                  </div>
                  <div className="mobile-tx-desc">{t.tesvir}</div>
                  <div className="mobile-tx-bottom">
                    <span className="mobile-tx-date">{(() => { const d = new Date(t.tarix); return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`; })()}</span>
                    <div className="mobile-tx-amounts">
                      <span className="money">{formatMoney(t.mebleg)}</span>
                      {t.borc_mebleg > 0 && <span className="money negative">Borc: {formatMoney(t.borc_mebleg)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">Hələ heç bir əməliyyat yoxdur</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
