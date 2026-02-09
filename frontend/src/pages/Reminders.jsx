import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBell, FiAlertTriangle, FiCheck, FiPhone, FiClock } from 'react-icons/fi';

function Reminders() {
  const [todayReminders, setTodayReminders] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const [today, overdue] = await Promise.all([
        axios.get('/api/reminders/today'),
        axios.get('/api/reminders/overdue')
      ]);
      
      setTodayReminders(today.data);
      setOverduePayments(overdue.data);
    } catch (error) {
      console.error('Xatırlatmalar yüklənmədi:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsSent = async (id) => {
    try {
      await axios.put(`/api/reminders/${id}/mark-sent`);
      fetchReminders();
    } catch (error) {
      console.error('Xəta:', error);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN'
    }).format(amount || 0);
  };

  const getDaysOverdue = (dateStr) => {
    const dueDate = new Date(dateStr);
    const today = new Date();
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="loading">Yüklənir...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Xatırlatmalar</h2>
      </div>

      {/* Bugünkü xatırlatmalar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiBell color="#f59e0b" /> Bugünkü Xatırlatmalar
          </h3>
          <span className="badge badge-warning">{todayReminders.length} ədəd</span>
        </div>

        {todayReminders.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Xəstə</th>
                  <th>Telefon</th>
                  <th>Əməliyyat</th>
                  <th>Borc</th>
                  <th>Son Tarix</th>
                  <th>Mesaj</th>
                  <th>Əməliyyat</th>
                </tr>
              </thead>
              <tbody>
                {todayReminders.map(r => (
                  <tr key={r.id}>
                    <td><strong>{r.ad} {r.soyad}</strong></td>
                    <td>
                      {r.telefon && (
                        <a href={`tel:${r.telefon}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                          <FiPhone size={14} /> {r.telefon}
                        </a>
                      )}
                    </td>
                    <td>{r.tesvir}</td>
                    <td className="money negative">{formatMoney(r.borc_mebleg)}</td>
                    <td>{r.son_odenis_tarixi ? (() => { const d = new Date(r.son_odenis_tarixi); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const wd = d.toLocaleDateString('az-AZ',{weekday:'long'}); return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)}`; })() : '-'}</td>
                    <td>{r.mesaj || '-'}</td>
                    <td>
                      <button className="btn btn-success btn-sm" onClick={() => markAsSent(r.id)}>
                        <FiCheck /> Göndərildi
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FiBell size={48} />
            <p>Bugün heç bir xatırlatma yoxdur</p>
          </div>
        )}
      </div>

      {/* Gecikmiş ödənişlər */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiAlertTriangle color="#ef4444" /> Gecikmiş Ödənişlər
          </h3>
          <span className="badge badge-danger">{overduePayments.length} ədəd</span>
        </div>

        {overduePayments.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Xəstə</th>
                  <th>Telefon</th>
                  <th>Təsvir</th>
                  <th>Borc</th>
                  <th>Son Tarix</th>
                  <th>Gecikmə</th>
                </tr>
              </thead>
              <tbody>
                {overduePayments.map(o => (
                  <tr key={o.id}>
                    <td><strong>{o.ad} {o.soyad}</strong></td>
                    <td>
                      {o.telefon && (
                        <a href={`tel:${o.telefon}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                          <FiPhone size={14} /> {o.telefon}
                        </a>
                      )}
                    </td>
                    <td>{o.tesvir}</td>
                    <td className="money negative">{formatMoney(o.borc_mebleg)}</td>
                    <td>{(() => { const d = new Date(o.son_odenis_tarixi); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const wd = d.toLocaleDateString('az-AZ',{weekday:'long'}); return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)}`; })()}</td>
                    <td>
                      <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <FiClock size={12} /> {getDaysOverdue(o.son_odenis_tarixi)} gün
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <FiAlertTriangle size={48} />
            <p>Gecikmiş ödəniş yoxdur</p>
          </div>
        )}
      </div>

      {/* Xatırlatma yaratmaq haqqında məlumat */}
      <div className="card" style={{ marginTop: '1.5rem', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          <FiBell size={24} color="#0284c7" />
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: '#0369a1' }}>Xatırlatmalar Haqqında</h4>
            <p style={{ color: '#0369a1', fontSize: '0.875rem' }}>
              Sistem avtomatik olaraq son ödəniş tarixindən 3 gün əvvəl xatırlatma yaradır. 
              Həmçinin hər gün səhər 9:00-da gecikmiş ödənişlər yoxlanılır və statusları yenilənir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reminders;
