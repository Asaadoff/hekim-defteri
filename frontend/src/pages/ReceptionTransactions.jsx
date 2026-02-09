import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiPlus, FiEdit2, FiTrash2, FiClock, FiUser, FiChevronLeft, FiChevronRight,
  FiCheck, FiX, FiDollarSign, FiFileText, FiPhone, FiCalendar, FiUserPlus,
  FiFilter, FiList
} from 'react-icons/fi';

function ReceptionTransactions() {
  // ===== STATE =====
  const [appointments, setAppointments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showApptModal, setShowApptModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);

  // Active data
  const [activeAppt, setActiveAppt] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [apptTransactions, setApptTransactions] = useState({});

  // Forms
  const [apptForm, setApptForm] = useState({
    patient_id: '', tarix: '', saat: '', tesvir: '', qeyd: ''
  });
  const [receptionForm, setReceptionForm] = useState({
    patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0',
    odenis_usulu: 'nagd', son_odenis_tarixi: '', qeyd: ''
  });
  const [txFormData, setTxFormData] = useState({
    patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0', son_odenis_tarixi: ''
  });
  const [paymentData, setPaymentData] = useState({
    mebleg: '', odenis_usulu: 'nagd', qeyd: ''
  });

  // Quick Patient
  const [showQuickPatient, setShowQuickPatient] = useState(false);
  const [quickPatientForm, setQuickPatientForm] = useState({ ad: '', soyad: '', telefon: '' });

  // ===== DATA FETCHING =====
  useEffect(() => {
    fetchPatients();
    fetchServices();
    fetchTransactions();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/appointments?date=${selectedDate}`);
      setAppointments(response.data);
    } catch (error) {
      console.error('Randevular yüklənmədi:', error);
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

  // Quick patient creation
  const handleQuickPatientCreate = async () => {
    if (!quickPatientForm.ad || !quickPatientForm.soyad) {
      alert('Ad və soyad tələb olunur!');
      return null;
    }
    try {
      const response = await axios.post('/api/patients', quickPatientForm);
      const newPatient = response.data;
      await fetchPatients(); // Refresh patient list
      setQuickPatientForm({ ad: '', soyad: '', telefon: '' });
      setShowQuickPatient(false);
      return newPatient.id;
    } catch (error) {
      console.error('Xəstə yaradılmadı:', error);
      alert('Xəstə yaradılarkən xəta baş verdi!');
      return null;
    }
  };

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Xidmətlər yüklənmədi:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setTxLoading(true);
      const response = await axios.get(`/api/transactions${statusFilter ? `?status=${statusFilter}` : ''}`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Əməliyyatlar yüklənmədi:', error);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchPatientTransactions = async (patientId) => {
    try {
      const response = await axios.get(`/api/transactions?patient_id=${patientId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  };

  // Toggle expanded view for appointment
  const toggleExpand = async (appt) => {
    if (expandedId === appt.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(appt.id);
    if (!apptTransactions[appt.patient_id]) {
      const txs = await fetchPatientTransactions(appt.patient_id);
      setApptTransactions(prev => ({ ...prev, [appt.patient_id]: txs }));
    }
  };

  // ===== APPOINTMENT HANDLERS =====
  const handleApptSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...apptForm, tarix: apptForm.tarix || selectedDate };
      if (apptForm.id) {
        await axios.put(`/api/appointments/${apptForm.id}`, payload);
      } else {
        await axios.post('/api/appointments', payload);
      }
      setShowApptModal(false);
      setApptForm({ patient_id: '', tarix: '', saat: '', tesvir: '', qeyd: '' });
      fetchAppointments();
    } catch (error) {
      console.error('Xəta:', error);
    }
  };

  const handleApptEdit = (appt) => {
    setApptForm({
      id: appt.id,
      patient_id: appt.patient_id,
      tarix: appt.tarix,
      saat: appt.saat,
      tesvir: appt.tesvir,
      qeyd: appt.qeyd || ''
    });
    setShowApptModal(true);
  };

  const handleApptDelete = async (id) => {
    if (window.confirm('Bu randevunu silmək istədiyinizə əminsiniz?')) {
      try {
        await axios.delete(`/api/appointments/${id}`);
        fetchAppointments();
      } catch (error) {
        console.error('Silinmədi:', error);
      }
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      if (status === 'tamamlandi') {
        await axios.delete(`/api/appointments/${id}`);
      } else {
        await axios.put(`/api/appointments/${id}`, { status });
      }
      fetchAppointments();
    } catch (error) {
      console.error('Status yenilənmədi:', error);
    }
  };

  // ===== RECEPTION (Transaction + Payment) =====
  const openReception = (appt) => {
    setActiveAppt(appt);
    setReceptionForm({
      patient_id: appt.patient_id,
      tesvir: appt.tesvir || '',
      mebleg: '',
      odenis_mebleg: '0',
      odenis_usulu: 'nagd',
      son_odenis_tarixi: '',
      qeyd: ''
    });
    setShowReceptionModal(true);
  };

  const openWalkIn = () => {
    setActiveAppt(null);
    setReceptionForm({
      patient_id: '',
      tesvir: '',
      mebleg: '',
      odenis_mebleg: '0',
      odenis_usulu: 'nagd',
      son_odenis_tarixi: '',
      qeyd: ''
    });
    setShowWalkInModal(true);
  };

  const handleReceptionSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/transactions', {
        patient_id: receptionForm.patient_id,
        tesvir: receptionForm.tesvir,
        mebleg: receptionForm.mebleg,
        odenis_mebleg: receptionForm.odenis_mebleg,
        son_odenis_tarixi: receptionForm.son_odenis_tarixi || null
      });

      if (activeAppt) {
        await axios.delete(`/api/appointments/${activeAppt.id}`);
      }

      setShowReceptionModal(false);
      setShowWalkInModal(false);
      setActiveAppt(null);
      fetchAppointments();
      // Also refresh transactions list
      if (activeTab === 'transactions') fetchTransactions();

      if (receptionForm.patient_id) {
        const txs = await fetchPatientTransactions(receptionForm.patient_id);
        setApptTransactions(prev => ({ ...prev, [receptionForm.patient_id]: txs }));
      }
      fetchTransactions();
    } catch (error) {
      console.error('Qəbul xətası:', error);
    }
  };

  const handleServiceSelect = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      setReceptionForm(prev => ({
        ...prev,
        tesvir: service.ad,
        mebleg: service.qiymet.toString()
      }));
    }
  };

  // ===== TRANSACTION HANDLERS =====
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    try {
      if (txFormData.id) {
        await axios.put(`/api/transactions/${txFormData.id}`, txFormData);
      } else {
        await axios.post('/api/transactions', txFormData);
      }
      setShowTxModal(false);
      setTxFormData({ patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0', son_odenis_tarixi: '' });
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

  const handleTxDelete = async (id) => {
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

  // ===== HELPERS =====
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const weekday = d.toLocaleDateString('az-AZ', { weekday: 'long' });
    return `${day}.${month}.${year}, ${weekday.charAt(0).toUpperCase() + weekday.slice(1)}`;
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('az-AZ', { style: 'currency', currency: 'AZN' }).format(amount || 0);
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'tamamlandi': return { badge: 'success', text: 'Tamamlandı' };
      case 'legv_edildi': return { badge: 'danger', text: 'Ləğv edildi' };
      case 'gozleyir': return { badge: 'warning', text: 'Gözləyir' };
      default: return { badge: 'info', text: 'Planlanıb' };
    }
  };

  // Stats for the day
  const dayStats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'tamamlandi').length,
    pending: appointments.filter(a => a.status === 'planlanib' || !a.status).length,
    cancelled: appointments.filter(a => a.status === 'legv_edildi').length
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h2>Qəbul və Əməliyyatlar</h2>
        <div className="page-header-actions">
          <button className="btn btn-success" onClick={openWalkIn}>
            <FiUserPlus /> Randevusuz Qəbul
          </button>
          <button className="btn btn-primary" onClick={() => {
            setApptForm({ patient_id: '', tarix: selectedDate, saat: '', tesvir: '', qeyd: '' });
            setShowApptModal(true);
          }}>
            <FiPlus /> Yeni Randevu
          </button>
          <button className="btn btn-primary" onClick={() => {
            setTxFormData({ patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0', son_odenis_tarixi: '' });
            setShowTxModal(true);
          }}>
            <FiPlus /> Yeni Əməliyyat
          </button>
        </div>
      </div>

      {/* ==================== RANDEVU BÖLMƏSI ==================== */}

      {/* Date Navigation */}
      <div className="date-nav-card">
        <div className="date-nav-row">
          <button className="date-nav-arrow" onClick={() => changeDate(-1)}>
            <FiChevronLeft />
          </button>
          <div className="date-nav-center" onClick={() => document.getElementById('date-picker-input').showPicker?.() || document.getElementById('date-picker-input').focus()}>
            <span className="date-nav-date">{formatDate(selectedDate)}</span>
            {isToday ? (
              <span className="date-nav-today">● Bugün</span>
            ) : (
              <button className="date-nav-back" onClick={(e) => { e.stopPropagation(); setSelectedDate(new Date().toISOString().split('T')[0]); }}>
                Bugünə qayıt
              </button>
            )}
          </div>
          <button className="date-nav-arrow" onClick={() => changeDate(1)}>
            <FiChevronRight />
          </button>
        </div>
        <input
          id="date-picker-input"
          type="date"
          value={selectedDate}
          min="2026-01-01"
          max="2035-12-31"
              onChange={e => { if (e.target.value) setSelectedDate(e.target.value); }}
              className="date-nav-hidden-input"
            />
          </div>

          {/* Day Stats */}
          <div className="reception-stats">
            <div className="reception-stat">
              <span className="reception-stat-num">{dayStats.total}</span>
              <span className="reception-stat-label">Ümumi</span>
            </div>
            <div className="reception-stat completed">
              <span className="reception-stat-num">{dayStats.completed}</span>
              <span className="reception-stat-label">Tamamlanmış</span>
            </div>
            <div className="reception-stat pending">
              <span className="reception-stat-num">{dayStats.pending}</span>
              <span className="reception-stat-label">Gözləyən</span>
            </div>
            <div className="reception-stat cancelled">
              <span className="reception-stat-num">{dayStats.cancelled}</span>
              <span className="reception-stat-label">Ləğv</span>
            </div>
          </div>

          {/* Appointments List */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <FiCalendar style={{ marginRight: '0.5rem' }} />
                Günün Cədvəli
              </h3>
            </div>

            {loading ? (
              <div className="empty-state">Yüklənir...</div>
            ) : appointments.length > 0 ? (
              <div className="reception-list">
                {appointments.map(appt => {
                  const statusInfo = getStatusInfo(appt.status);
                  const isExpanded = expandedId === appt.id;
                  const patientTxs = apptTransactions[appt.patient_id] || [];

                  return (
                    <div key={appt.id} className={`reception-item ${appt.status || 'planlanib'}`}>
                      {/* Main row */}
                      <div className="reception-item-main" onClick={() => toggleExpand(appt)}>
                        <div className="reception-time">
                          <FiClock />
                          <span>{appt.saat || '--:--'}</span>
                        </div>

                        <div className="reception-patient-info">
                          <div className="reception-patient-name">
                            <FiUser />
                            <strong>{appt.ad} {appt.soyad}</strong>
                            {appt.telefon && (
                              <span className="reception-phone"><FiPhone size={12} /> {appt.telefon}</span>
                            )}
                          </div>
                          <div className="reception-desc">
                            <FiFileText size={13} />
                            {appt.tesvir}
                          </div>
                          {appt.qeyd && <div className="reception-note">{appt.qeyd}</div>}
                        </div>

                        <div className="reception-status">
                          <span className={`badge badge-${statusInfo.badge}`}>{statusInfo.text}</span>
                        </div>

                        <div className="reception-actions" onClick={e => e.stopPropagation()}>
                          {(appt.status === 'planlanib' || !appt.status) && (
                            <button className="btn btn-success btn-sm" title="Qəbul et" onClick={() => openReception(appt)}>
                              <FiDollarSign /> Qəbul
                            </button>
                          )}
                          {(appt.status === 'planlanib' || !appt.status) && (
                            <button className="btn btn-danger btn-sm" title="Ləğv et" onClick={() => handleStatusChange(appt.id, 'legv_edildi')}>
                              <FiX />
                            </button>
                          )}
                          <button className="btn btn-secondary btn-sm" title="Redaktə" onClick={() => handleApptEdit(appt)}>
                            <FiEdit2 />
                          </button>
                          <button className="btn btn-danger btn-sm" title="Sil" onClick={() => handleApptDelete(appt.id)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      {/* Expanded: Patient transaction history */}
                      {isExpanded && (
                        <div className="reception-expanded">
                          <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            <FiFileText /> {appt.ad} {appt.soyad} — Əməliyyat Tarixçəsi
                          </h4>
                          {patientTxs.length > 0 ? (
                            <table>
                              <thead>
                                <tr>
                                  <th>Tarix</th>
                                  <th>Təsvir</th>
                                  <th>Məbləğ</th>
                                  <th>Ödənildi</th>
                                  <th>Borc</th>
                                  <th>Status</th>
                                  <th>Əməliyyat</th>
                                </tr>
                              </thead>
                              <tbody>
                                {patientTxs.map(t => (
                                  <tr key={t.id}>
                                    <td>{(() => { const d = new Date(t.tarix); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const wd = d.toLocaleDateString('az-AZ',{weekday:'long'}); return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)}`; })()}</td>
                                    <td>{t.tesvir}</td>
                                    <td className="money">{formatMoney(t.mebleg)}</td>
                                    <td className="money positive">{formatMoney(t.odenis_mebleg)}</td>
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
                                    <td>
                                      <div className="action-buttons">
                                        {t.status !== 'odenildi' && (
                                          <button className="btn btn-success btn-sm" onClick={() => { openPayModal(t); setActiveTab('transactions'); }}>
                                            <FiDollarSign />
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Bu xəstənin əvvəlki əməliyyatı yoxdur</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                Bu tarixdə heç bir randevu yoxdur
              </div>
            )}
          </div>

      {/* ==================== ƏMƏLIYYATLAR BÖLMƏSI ==================== */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title"><FiList style={{ marginRight: '0.5rem' }} /> Bütün Əməliyyatlar</h3>
          <div className="filter-row">
            <FiFilter />
              <select
                className="form-control filter-select"
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
                            setTxFormData(t);
                            setShowTxModal(true);
                          }}>
                            <FiEdit2 />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleTxDelete(t.id)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="empty-state">
                      {txLoading ? 'Yüklənir...' : 'Heç bir əməliyyat tapılmadı'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* =============== MODALS =============== */}

      {/* Randevu Modal */}
      {showApptModal && (
        <div className="modal-overlay" onClick={() => setShowApptModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{apptForm.id ? 'Randevunu Redaktə Et' : 'Yeni Randevu'}</h3>
              <button className="modal-close" onClick={() => setShowApptModal(false)}>&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              let patientId = apptForm.patient_id;
              if (showQuickPatient) {
                patientId = await handleQuickPatientCreate();
                if (!patientId) return;
                setApptForm(prev => ({ ...prev, patient_id: patientId }));
              }
              if (!patientId) { alert('Xəstə seçin və ya yeni xəstə əlavə edin!'); return; }
              const formToSubmit = { ...apptForm, patient_id: patientId };
              try {
                if (formToSubmit.id) {
                  await axios.put(`/api/appointments/${formToSubmit.id}`, formToSubmit);
                } else {
                  await axios.post('/api/appointments', formToSubmit);
                }
                setShowApptModal(false);
                setShowQuickPatient(false);
                setApptForm({ patient_id: '', tarix: '', saat: '', tesvir: '', qeyd: '' });
                fetchAppointments();
              } catch (error) {
                console.error('Xəta:', error);
              }
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ margin: 0 }}>Xəstə *</label>
                    <button type="button" className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => { setShowQuickPatient(!showQuickPatient); setApptForm({ ...apptForm, patient_id: '' }); }}>
                      {showQuickPatient ? '← Mövcud Xəstə' : '+ Yeni Xəstə'}
                    </button>
                  </div>
                  {!showQuickPatient ? (
                    <select className="form-control" value={apptForm.patient_id}
                      onChange={e => setApptForm({ ...apptForm, patient_id: e.target.value })} required={!showQuickPatient}>
                      <option value="">Xəstə seçin</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" className="form-control" placeholder="Ad *" value={quickPatientForm.ad}
                        onChange={e => setQuickPatientForm({ ...quickPatientForm, ad: e.target.value })} required />
                      <input type="text" className="form-control" placeholder="Soyad *" value={quickPatientForm.soyad}
                        onChange={e => setQuickPatientForm({ ...quickPatientForm, soyad: e.target.value })} required />
                      <input type="text" className="form-control" placeholder="Telefon" value={quickPatientForm.telefon}
                        onChange={e => setQuickPatientForm({ ...quickPatientForm, telefon: e.target.value })} />
                    </div>
                  )}
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Tarix *</label>
                    <input type="date" className="form-control" value={apptForm.tarix || selectedDate}
                      onChange={e => setApptForm({ ...apptForm, tarix: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Saat *</label>
                    <input type="time" className="form-control" value={apptForm.saat}
                      onChange={e => setApptForm({ ...apptForm, saat: e.target.value })} required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Əməliyyat / Təsvir *</label>
                  <input type="text" className="form-control" value={apptForm.tesvir}
                    onChange={e => setApptForm({ ...apptForm, tesvir: e.target.value })}
                    placeholder="Məs: Diş sinirinin çıxarılması" required />
                </div>
                <div className="form-group">
                  <label>Qeyd</label>
                  <textarea className="form-control" rows="2" value={apptForm.qeyd}
                    onChange={e => setApptForm({ ...apptForm, qeyd: e.target.value })}
                    placeholder="Əlavə qeyd..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowApptModal(false)}>Ləğv et</button>
                <button type="submit" className="btn btn-primary">{apptForm.id ? 'Yenilə' : 'Əlavə et'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Qəbul Modal (randevu ilə) */}
      {showReceptionModal && activeAppt && (
        <div className="modal-overlay" onClick={() => setShowReceptionModal(false)}>
          <div className="modal modal-narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiDollarSign style={{ marginRight: '0.5rem' }} /> Qəbul — {activeAppt.ad} {activeAppt.soyad}</h3>
              <button className="modal-close" onClick={() => setShowReceptionModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReceptionSubmit}>
              <div className="modal-body">
                <div className="reception-modal-info">
                  <p><FiClock /> <strong>Saat:</strong> {activeAppt.saat}</p>
                  <p><FiFileText /> <strong>Plan:</strong> {activeAppt.tesvir}</p>
                  {activeAppt.telefon && <p><FiPhone /> <strong>Tel:</strong> {activeAppt.telefon}</p>}
                </div>

                {services.length > 0 && (
                  <div className="form-group">
                    <label>Xidmət Seçin (ixtiyari)</label>
                    <select className="form-control" onChange={e => handleServiceSelect(e.target.value)}>
                      <option value="">— Xidmət seçin və ya əl ilə yazın —</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.ad} — {formatMoney(s.qiymet)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Əməliyyat Təsviri *</label>
                  <input type="text" className="form-control" value={receptionForm.tesvir}
                    onChange={e => setReceptionForm({ ...receptionForm, tesvir: e.target.value })}
                    placeholder="Görülən iş" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ümumi Məbləğ (AZN) *</label>
                    <input type="number" step="0.01" className="form-control" value={receptionForm.mebleg}
                      onChange={e => setReceptionForm({ ...receptionForm, mebleg: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Ödənən Məbləğ (AZN)</label>
                    <input type="number" step="0.01" className="form-control" value={receptionForm.odenis_mebleg}
                      onChange={e => setReceptionForm({ ...receptionForm, odenis_mebleg: e.target.value })} />
                  </div>
                </div>

                {parseFloat(receptionForm.mebleg) > 0 && parseFloat(receptionForm.odenis_mebleg) < parseFloat(receptionForm.mebleg) && (
                  <div className="reception-debt-warning">
                    <span>Qalan borc: <strong>{formatMoney(parseFloat(receptionForm.mebleg) - parseFloat(receptionForm.odenis_mebleg || 0))}</strong></span>
                  </div>
                )}

                {parseFloat(receptionForm.odenis_mebleg) > 0 && (
                  <div className="form-group">
                    <label>Ödəniş Üsulu</label>
                    <select className="form-control" value={receptionForm.odenis_usulu}
                      onChange={e => setReceptionForm({ ...receptionForm, odenis_usulu: e.target.value })}>
                      <option value="nagd">Nağd</option>
                      <option value="kart">Kart</option>
                      <option value="kocurme">Köçürmə</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Son Ödəniş Tarixi (borc varsa)</label>
                  <input type="date" className="form-control" value={receptionForm.son_odenis_tarixi}
                    onChange={e => setReceptionForm({ ...receptionForm, son_odenis_tarixi: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowReceptionModal(false)}>Ləğv et</button>
                <button type="submit" className="btn btn-success"><FiCheck /> Qəbulu Tamamla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Randevusuz Qəbul Modal */}
      {showWalkInModal && (
        <div className="modal-overlay" onClick={() => setShowWalkInModal(false)}>
          <div className="modal modal-narrow" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiUserPlus style={{ marginRight: '0.5rem' }} /> Randevusuz Qəbul</h3>
              <button className="modal-close" onClick={() => setShowWalkInModal(false)}>&times;</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              let patientId = receptionForm.patient_id;
              if (showQuickPatient) {
                patientId = await handleQuickPatientCreate();
                if (!patientId) return;
              }
              if (!patientId) { alert('Xəstə seçin və ya yeni xəstə əlavə edin!'); return; }
              const formToSubmit = { ...receptionForm, patient_id: patientId };
              try {
                await axios.post('/api/transactions', formToSubmit);
                setShowWalkInModal(false);
                setShowQuickPatient(false);
                setReceptionForm({ patient_id: '', tesvir: '', mebleg: '', odenis_mebleg: '0', odenis_usulu: 'nagd', son_odenis_tarixi: '', qeyd: '' });
                fetchTransactions();
              } catch (error) {
                console.error('Xəta:', error);
              }
            }}>
              <div className="modal-body">
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label style={{ margin: 0 }}>Xəstə *</label>
                    <button type="button" className="btn btn-sm" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      onClick={() => { setShowQuickPatient(!showQuickPatient); setReceptionForm({ ...receptionForm, patient_id: '' }); }}>
                      {showQuickPatient ? '← Mövcud Xəstə' : '+ Yeni Xəstə'}
                    </button>
                  </div>
                  {!showQuickPatient ? (
                    <select className="form-control" value={receptionForm.patient_id}
                      onChange={e => setReceptionForm({ ...receptionForm, patient_id: e.target.value })} required={!showQuickPatient}>
                      <option value="">Xəstə seçin</option>
                      {patients.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" className="form-control" placeholder="Ad *" value={quickPatientForm.ad}
                        onChange={e => setQuickPatientForm({ ...quickPatientForm, ad: e.target.value })} required />
                      <input type="text" className="form-control" placeholder="Soyad *" value={quickPatientForm.soyad}
                        onChange={e => setQuickPatientForm({ ...quickPatientForm, soyad: e.target.value })} required />
                      <input type="text" className="form-control" placeholder="Telefon" value={quickPatientForm.telefon}
                        onChange={e => setQuickPatientForm({ ...quickPatientForm, telefon: e.target.value })} />
                    </div>
                  )}
                </div>

                {services.length > 0 && (
                  <div className="form-group">
                    <label>Xidmət Seçin (ixtiyari)</label>
                    <select className="form-control" onChange={e => handleServiceSelect(e.target.value)}>
                      <option value="">— Xidmət seçin və ya əl ilə yazın —</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>{s.ad} — {formatMoney(s.qiymet)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Əməliyyat Təsviri *</label>
                  <input type="text" className="form-control" value={receptionForm.tesvir}
                    onChange={e => setReceptionForm({ ...receptionForm, tesvir: e.target.value })}
                    placeholder="Görülən iş" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Ümumi Məbləğ (AZN) *</label>
                    <input type="number" step="0.01" className="form-control" value={receptionForm.mebleg}
                      onChange={e => setReceptionForm({ ...receptionForm, mebleg: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Ödənən Məbləğ (AZN)</label>
                    <input type="number" step="0.01" className="form-control" value={receptionForm.odenis_mebleg}
                      onChange={e => setReceptionForm({ ...receptionForm, odenis_mebleg: e.target.value })} />
                  </div>
                </div>

                {parseFloat(receptionForm.mebleg) > 0 && parseFloat(receptionForm.odenis_mebleg) < parseFloat(receptionForm.mebleg) && (
                  <div className="reception-debt-warning">
                    <span>Qalan borc: <strong>{formatMoney(parseFloat(receptionForm.mebleg) - parseFloat(receptionForm.odenis_mebleg || 0))}</strong></span>
                  </div>
                )}

                {parseFloat(receptionForm.odenis_mebleg) > 0 && (
                  <div className="form-group">
                    <label>Ödəniş Üsulu</label>
                    <select className="form-control" value={receptionForm.odenis_usulu}
                      onChange={e => setReceptionForm({ ...receptionForm, odenis_usulu: e.target.value })}>
                      <option value="nagd">Nağd</option>
                      <option value="kart">Kart</option>
                      <option value="kocurme">Köçürmə</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label>Son Ödəniş Tarixi (borc varsa)</label>
                  <input type="date" className="form-control" value={receptionForm.son_odenis_tarixi}
                    onChange={e => setReceptionForm({ ...receptionForm, son_odenis_tarixi: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowWalkInModal(false)}>Ləğv et</button>
                <button type="submit" className="btn btn-success"><FiCheck /> Qəbulu Tamamla</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Əməliyyat əlavə/redaktə Modalı */}
      {showTxModal && (
        <div className="modal-overlay" onClick={() => setShowTxModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{txFormData.id ? 'Əməliyyatı Redaktə Et' : 'Yeni Əməliyyat'}</h3>
              <button className="modal-close" onClick={() => setShowTxModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleTxSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Xəstə *</label>
                  <select
                    className="form-control"
                    value={txFormData.patient_id}
                    onChange={e => setTxFormData({...txFormData, patient_id: e.target.value})}
                    required
                    disabled={!!txFormData.id}
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
                    value={txFormData.tesvir}
                    onChange={e => setTxFormData({...txFormData, tesvir: e.target.value})}
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
                      value={txFormData.mebleg}
                      onChange={e => setTxFormData({...txFormData, mebleg: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>İlkin Ödəniş (AZN)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={txFormData.odenis_mebleg}
                      onChange={e => setTxFormData({...txFormData, odenis_mebleg: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Son Ödəniş Tarixi</label>
                  <input
                    type="date"
                    className="form-control"
                    value={txFormData.son_odenis_tarixi}
                    onChange={e => setTxFormData({...txFormData, son_odenis_tarixi: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTxModal(false)}>Ləğv et</button>
                <button type="submit" className="btn btn-primary">{txFormData.id ? 'Yenilə' : 'Əlavə et'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ödəniş Modalı */}
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Ləğv et</button>
                <button type="submit" className="btn btn-success">Ödənişi Qeyd Et</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceptionTransactions;
