import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiFilter, FiEdit2, FiTrash2, FiDollarSign } from 'react-icons/fi';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0', son_odenis_tarixi: ''
  });
  const [paymentData, setPaymentData] = useState({
    mebleg: '', odenis_usulu: 'nagd', qeyd: ''
  });

  useEffect(() => {
    fetchTransactions();
    fetchPatients();
  }, [statusFilter]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`/api/transactions${statusFilter ? `?status=${statusFilter}` : ''}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Əməliyyatlar yüklənmədi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Xəstələr yüklənmədi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`/api/transactions/${formData.id}`, formData);
      } else {
        await axios.post('/api/transactions', formData);
      }
      setShowModal(false);
      setFormData({ patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0', son_odenis_tarixi: '' });
      fetchTransactions();
    } catch (error) {
      console.error('Xəta:', error);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/payments', {
        transaction_id: selectedTransaction.id,
        ...paymentData
      });
      setShowPayModal(false);
      setPaymentData({ mebleg: '', odenis_usulu: 'nagd', qeyd: '' });
      fetchTransactions();
    } catch (error) {
      console.error('Ödəniş xətası:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu əməliyyatı silmək istədiyinizə əminsiniz?')) {
      try {
        await axios.delete(`/api/transactions/${id}`);
        fetchTransactions();
      } catch (error) {
        console.error('Silinmədi:', error);
      }
    }
  };

  const openPayModal = (transaction) => {
    setSelectedTransaction(transaction);
    setPaymentData({ mebleg: transaction.borc_mebleg.toString(), odenis_usulu: 'nagd', qeyd: '' });
    setShowPayModal(true);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN'
    }).format(amount || 0);
  };

  return (
    <div>
      <div className="page-header">
        <h2>Əməliyyatlar / Nisyə</h2>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0', son_odenis_tarixi: '' });
          setShowModal(true);
        }}>
          <FiPlus /> Yeni Əməliyyat
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiFilter />
            <select 
              className="form-control" 
              style={{ width: '200px' }}
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">Bütün Statuslar</option>
              <option value="gozleyir">Gözləyir</option>
              <option value="qismen_odenildi">Qismən Ödənildi</option>
              <option value="odenildi">Ödənildi</option>
              <option value="gecikdi">Gecikdi</option>
            </select>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Xəstə</th>
                <th>Təsvir</th>
                <th>Məbləğ</th>
                <th>Ödənildi</th>
                <th>Borc</th>
                <th>Son Tarix</th>
                <th>Status</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length > 0 ? (
                transactions.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.ad} {t.soyad}</strong></td>
                    <td>{t.tesvir}</td>
                    <td className="money">{formatMoney(t.mebleg)}</td>
                    <td className="money positive">{formatMoney(t.odenis_mebleg)}</td>
                    <td className="money negative">{formatMoney(t.borc_mebleg)}</td>
                    <td>{t.son_odenis_tarixi ? (() => { const d = new Date(t.son_odenis_tarixi); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const wd = d.toLocaleDateString('az-AZ',{weekday:'long'}); return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)}`; })() : '-'}</td>
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
                    <td>
                      <div className="action-buttons">
                        {t.status !== 'odenildi' && (
                          <button className="btn btn-success btn-sm" onClick={() => openPayModal(t)}>
                            <FiDollarSign />
                          </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setFormData(t);
                          setShowModal(true);
                        }}>
                          <FiEdit2 />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="empty-state">
                    {loading ? 'Yüklənir...' : 'Heç bir əməliyyat tapılmadı'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Əməliyyat əlavə/redaktə modalı */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formData.id ? 'Əməliyyatı Redaktə Et' : 'Yeni Əməliyyat'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Xəstə *</label>
                  <select
                    className="form-control"
                    value={formData.patient_id}
                    onChange={e => setFormData({...formData, patient_id: e.target.value})}
                    required
                    disabled={!!formData.id}
                  >
                    <option value="">Xəstə seçin</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Təsvir *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.tesvir}
                    onChange={e => setFormData({...formData, tesvir: e.target.value})}
                    placeholder="Məs: Diş müayinəsi, Əməliyyat və s."
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Məbləğ (AZN) *</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.mebleg}
                      onChange={e => setFormData({...formData, mebleg: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>İlkin Ödəniş (AZN)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={formData.odenis_mebleg}
                      onChange={e => setFormData({...formData, odenis_mebleg: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Son Ödəniş Tarixi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formData.son_odenis_tarixi}
                    onChange={e => setFormData({...formData, son_odenis_tarixi: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Ləğv et
                </button>
                <button type="submit" className="btn btn-primary">
                  {formData.id ? 'Yenilə' : 'Əlavə et'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ödəniş modalı */}
      {showPayModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ödəniş Al</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>&times;</button>
            </div>
            <form onSubmit={handlePayment}>
              <div className="modal-body">
                <p style={{ marginBottom: '1rem' }}>
                  <strong>{selectedTransaction.ad} {selectedTransaction.soyad}</strong> - {selectedTransaction.tesvir}
                </p>
                <p style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>
                  Qalan borc: <span className="money negative">{formatMoney(selectedTransaction.borc_mebleg)}</span>
                </p>
                
                <div className="form-group">
                  <label>Ödəniş Məbləği (AZN) *</label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedTransaction.borc_mebleg}
                    className="form-control"
                    value={paymentData.mebleg}
                    onChange={e => setPaymentData({...paymentData, mebleg: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Ödəniş Üsulu</label>
                  <select
                    className="form-control"
                    value={paymentData.odenis_usulu}
                    onChange={e => setPaymentData({...paymentData, odenis_usulu: e.target.value})}
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
                    value={paymentData.qeyd}
                    onChange={e => setPaymentData({...paymentData, qeyd: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>
                  Ləğv et
                </button>
                <button type="submit" className="btn btn-success">
                  Ödənişi Qeyd Et
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;
