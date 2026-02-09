import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCalendar, FiDollarSign, FiCreditCard, FiArrowRight, FiEdit2, FiTrash2 } from 'react-icons/fi';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '', mebleg: '', odenis_usulu: 'nagd', qeyd: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchDailySummary();
  }, [startDate, endDate]);

  const fetchPayments = async () => {
    try {
      let url = '/api/payments';
      const params = [];
      if (startDate) params.push(`start_date=${startDate}`);
      if (endDate) params.push(`end_date=${endDate}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await axios.get(url);
      setPayments(response.data);
    } catch (error) {
      console.error('Ödənişlər yüklənmədi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailySummary = async () => {
    try {
      const response = await axios.get('/api/payments/summary/daily');
      setDailySummary(response.data);
    } catch (error) {
      console.error('Günlük hesabat yüklənmədi:', error);
    }
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN'
    }).format(amount || 0);
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'nagd': return 'Nağd';
      case 'kart': return 'Kart';
      case 'kocurme': return 'Köçürmə';
      default: return method;
    }
  };

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'kart': return <FiCreditCard />;
      case 'kocurme': return <FiArrowRight />;
      default: return <FiDollarSign />;
    }
  };

  const openEditModal = (payment) => {
    setEditForm({
      id: payment.id,
      mebleg: payment.mebleg.toString(),
      odenis_usulu: payment.odenis_usulu,
      qeyd: payment.qeyd || ''
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/payments/${editForm.id}`, {
        mebleg: editForm.mebleg,
        odenis_usulu: editForm.odenis_usulu,
        qeyd: editForm.qeyd
      });
      setShowEditModal(false);
      fetchPayments();
      fetchDailySummary();
    } catch (error) {
      console.error('Ödəniş yenilənmədi:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu ödənişi silmək istədiyinizə əminsiniz? Əməliyyatın borc məbləği geri qaytarılacaq.')) {
      try {
        await axios.delete(`/api/payments/${id}`);
        fetchPayments();
        fetchDailySummary();
      } catch (error) {
        console.error('Ödəniş silinmədi:', error);
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Ödənişlər</h2>
      </div>

      {/* Bugünkü statistika */}
      {dailySummary && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">Bugünkü Ödənişlər - {dailySummary.date}</h3>
          </div>
          <div className="daily-summary-stats">
            <div className="daily-summary-item">
              <p className="daily-summary-label">Ümumi</p>
              <p className="daily-summary-value success">
                {formatMoney(dailySummary.total)}
              </p>
            </div>
            {dailySummary.summary?.map((s, i) => (
              <div key={i} className="daily-summary-item">
                <p className="daily-summary-label">
                  {getPaymentMethodLabel(s.odenis_usulu)} ({s.count} ədəd)
                </p>
                <p className="daily-summary-value">
                  {formatMoney(s.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Ödəniş Tarixçəsi</h3>
          <div className="date-filter-row">
            <div className="date-filter-inputs">
              <FiCalendar />
              <input
                type="date"
                className="form-control date-filter-input"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span>-</span>
              <input
                type="date"
                className="form-control date-filter-input"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => { setStartDate(''); setEndDate(''); }}
              >
                Sıfırla
              </button>
            )}
          </div>
        </div>

        <div className="table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>Xəstə</th>
                <th>Əməliyyat</th>
                <th>Məbləğ</th>
                <th>Üsul</th>
                <th>Qeyd</th>
                <th>Tarix</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {payments.length > 0 ? (
                payments.map(p => (
                  <tr key={p.id}>
                    <td><strong>{p.ad} {p.soyad}</strong></td>
                    <td>{p.transaction_tesvir}</td>
                    <td className="money positive">{formatMoney(p.mebleg)}</td>
                    <td>
                      <span className="payment-method-cell">
                        {getPaymentMethodIcon(p.odenis_usulu)}
                        {getPaymentMethodLabel(p.odenis_usulu)}
                      </span>
                    </td>
                    <td>{p.qeyd || '-'}</td>
                    <td>{(() => { const d = new Date(p.tarix); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const wd = d.toLocaleDateString('az-AZ',{weekday:'long'}); const h = String(d.getHours()).padStart(2,'0'); const m = String(d.getMinutes()).padStart(2,'0'); return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)} ${h}:${m}`; })()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-secondary btn-sm" title="Redaktə et" onClick={() => openEditModal(p)}>
                          <FiEdit2 />
                        </button>
                        <button className="btn btn-danger btn-sm" title="Sil" onClick={() => handleDelete(p.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-state">
                    {loading ? 'Yüklənir...' : 'Heç bir ödəniş tapılmadı'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="mobile-card-list mobile-only">
          {payments.length > 0 ? (
            payments.map(p => (
              <div key={p.id} className="mobile-payment-card">
                <div className="mobile-payment-top">
                  <strong>{p.ad} {p.soyad}</strong>
                  <span className="money positive">{formatMoney(p.mebleg)}</span>
                </div>
                {p.transaction_tesvir && (
                  <div className="mobile-payment-desc">{p.transaction_tesvir}</div>
                )}
                <div className="mobile-payment-meta">
                  <span className="payment-method-cell">
                    {getPaymentMethodIcon(p.odenis_usulu)}
                    {getPaymentMethodLabel(p.odenis_usulu)}
                  </span>
                  <span className="mobile-payment-date">
                    {(() => { const d = new Date(p.tarix); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const h = String(d.getHours()).padStart(2,'0'); const m = String(d.getMinutes()).padStart(2,'0'); return `${day}.${month}.${year} ${h}:${m}`; })()}
                  </span>
                </div>
                {p.qeyd && <div className="mobile-payment-note">{p.qeyd}</div>}
                <div className="mobile-payment-actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(p)}>
                    <FiEdit2 /> Redaktə
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>
                    <FiTrash2 /> Sil
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              {loading ? 'Yüklənir...' : 'Heç bir ödəniş tapılmadı'}
            </div>
          )}
        </div>
      </div>

      {/* Ödəniş Redaktə Modalı */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ödənişi Redaktə Et</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Ödəniş Məbləği (AZN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={editForm.mebleg}
                    onChange={e => setEditForm({...editForm, mebleg: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ödəniş Üsulu</label>
                  <select
                    className="form-control"
                    value={editForm.odenis_usulu}
                    onChange={e => setEditForm({...editForm, odenis_usulu: e.target.value})}
                  >
                    <option value="nagd">Nağd</option>
                    <option value="kart">Kart</option>
                    <option value="kocurme">Köçürmə</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Qeyd</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.qeyd}
                    onChange={e => setEditForm({...editForm, qeyd: e.target.value})}
                    placeholder="Əlavə qeyd..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Ləğv et</button>
                <button type="submit" className="btn btn-primary">Yenilə</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
