import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  FiPlus, FiEdit2, FiTrash2, FiClock, FiUser, FiChevronLeft, FiChevronRight,
  FiCheck, FiX, FiDollarSign, FiFileText, FiPhone, FiCalendar, FiUserPlus
} from 'react-icons/fi';

function Reception() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Modals
  const [showApptModal, setShowApptModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showWalkInModal, setShowWalkInModal] = useState(false);

  // Active appointment for reception
  const [activeAppt, setActiveAppt] = useState(null);

  // Appointment form
  const [apptForm, setApptForm] = useState({
    patient_id: '', tarix: '', saat: '', tesvir: '', qeyd: ''
  });

  // Reception form (transaction + payment in one)
  const [receptionForm, setReceptionForm] = useState({
    patient_id: '',
    tesvir: '',
    mebleg: '',
    odenis_mebleg: '0',
    odenis_usulu: 'nagd',
    son_odenis_tarixi: '',
    qeyd: ''
  });

  // Expanded appointment details
  const [expandedId, setExpandedId] = useState(null);
  const [apptTransactions, setApptTransactions] = useState({});

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate]);

  useEffect(() => {
    fetchPatients();
    fetchServices();
  }, []);

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

  const fetchServices = async () => {
    try {
      const response = await axios.get('/api/services');
      setServices(response.data);
    } catch (error) {
      console.error('Xidmətlər yüklənmədi:', error);
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
      await axios.put(`/api/appointments/${id}`, { status });
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
      // 1. Create transaction
      const txResponse = await axios.post('/api/transactions', {
        patient_id: receptionForm.patient_id,
        tesvir: receptionForm.tesvir,
        mebleg: receptionForm.mebleg,
        odenis_mebleg: receptionForm.odenis_mebleg,
        son_odenis_tarixi: receptionForm.son_odenis_tarixi || null
      });

      // 2. If there's additional payment beyond initial, record it separately
      // (initial payment is already handled by transaction creation)

      // 3. Mark appointment as completed if applicable
      if (activeAppt) {
        await axios.put(`/api/appointments/${activeAppt.id}`, { status: 'tamamlandi' });
      }

      setShowReceptionModal(false);
      setShowWalkInModal(false);
      setActiveAppt(null);
      fetchAppointments();

      // Refresh transaction cache
      if (receptionForm.patient_id) {
        const txs = await fetchPatientTransactions(receptionForm.patient_id);
        setApptTransactions(prev => ({ ...prev, [receptionForm.patient_id]: txs }));
      }
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

  // ===== HELPERS =====
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDate = (dateStr) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('az-AZ', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
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
      <div className="page-header">
        <h2>Qəbul</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-success" onClick={openWalkIn}>
            <FiUserPlus /> Randevusuz Qəbul
          </button>
          <button className="btn btn-primary" onClick={() => {
            setApptForm({ patient_id: '', tarix: selectedDate, saat: '', tesvir: '', qeyd: '' });
            setShowApptModal(true);
          }}>
            <FiPlus /> Yeni Randevu
          </button>
        </div>
      </div>

      {/* Date Navigation */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => changeDate(-1)}>
            <FiChevronLeft /> Əvvəlki gün
          </button>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>{formatDate(selectedDate)}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              {isToday ? (
                <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: '600' }}>● Bugün</span>
              ) : (
                <button className="btn btn-sm" style={{ color: 'var(--primary)', background: 'none', padding: '0.125rem 0.5rem', fontSize: '0.8rem' }}
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
                  Bugünə qayıt
                </button>
              )}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={() => changeDate(1)}>
            Növbəti gün <FiChevronRight />
          </button>
        </div>
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
                            </tr>
                          </thead>
                          <tbody>
                            {patientTxs.map(t => (
                              <tr key={t.id}>
                                <td>{new Date(t.tarix).toLocaleDateString('az-AZ')}</td>
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

      {/* ===== RANDEVU MODAL ===== */}
      {showApptModal && (
        <div className="modal-overlay" onClick={() => setShowApptModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{apptForm.id ? 'Randevunu Redaktə Et' : 'Yeni Randevu'}</h3>
              <button className="modal-close" onClick={() => setShowApptModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleApptSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Xəstə *</label>
                  <select className="form-control" value={apptForm.patient_id}
                    onChange={e => setApptForm({ ...apptForm, patient_id: e.target.value })} required>
                    <option value="">Xəstə seçin</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
                  </select>
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

      {/* ===== QƏBUL MODAL (randevu ilə) ===== */}
      {showReceptionModal && activeAppt && (
        <div className="modal-overlay" onClick={() => setShowReceptionModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
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

      {/* ===== RANDEVUSUZ QƏBUL MODAL ===== */}
      {showWalkInModal && (
        <div className="modal-overlay" onClick={() => setShowWalkInModal(false)}>
          <div className="modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><FiUserPlus style={{ marginRight: '0.5rem' }} /> Randevusuz Qəbul</h3>
              <button className="modal-close" onClick={() => setShowWalkInModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleReceptionSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Xəstə *</label>
                  <select className="form-control" value={receptionForm.patient_id}
                    onChange={e => setReceptionForm({ ...receptionForm, patient_id: e.target.value })} required>
                    <option value="">Xəstə seçin</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.ad} {p.soyad}</option>)}
                  </select>
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
    </div>
  );
}

export default Reception;
