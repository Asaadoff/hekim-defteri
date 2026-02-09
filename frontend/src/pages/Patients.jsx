import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiEye, FiPhone, FiMail } from 'react-icons/fi';

function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState({
    ad: '', soyad: '', telefon: '', email: '', unvan: '', qeyd: ''
  });

  useEffect(() => {
    fetchPatients();
  }, [searchTerm]);

  const fetchPatients = async () => {
    try {
      const response = await axios.get(`/api/patients${searchTerm ? `?search=${searchTerm}` : ''}`);
      setPatients(response.data);
    } catch (error) {
      console.error('Xəstələr yüklənmədi:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientDetail = async (id) => {
    try {
      const response = await axios.get(`/api/patients/${id}`);
      setSelectedPatient(response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('Xəstə detalları yüklənmədi:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await axios.put(`/api/patients/${formData.id}`, formData);
      } else {
        await axios.post('/api/patients', formData);
      }
      setShowModal(false);
      setFormData({ ad: '', soyad: '', telefon: '', email: '', unvan: '', qeyd: '' });
      fetchPatients();
    } catch (error) {
      console.error('Xəta:', error);
    }
  };

  const handleEdit = (patient) => {
    setFormData(patient);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu xəstəni silmək istədiyinizə əminsiniz?')) {
      try {
        await axios.delete(`/api/patients/${id}`);
        fetchPatients();
      } catch (error) {
        console.error('Silinmədi:', error);
      }
    }
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
        <h2>Xəstələr</h2>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ ad: '', soyad: '', telefon: '', email: '', unvan: '', qeyd: '' });
          setShowModal(true);
        }}>
          <FiPlus /> Yeni Xəstə
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Xəstə axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container desktop-only">
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Telefon</th>
                <th>Email</th>
                <th>Qeydiyyat Tarixi</th>
                <th>Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {patients.length > 0 ? (
                patients.map(patient => (
                  <tr key={patient.id}>
                    <td><strong>{patient.ad} {patient.soyad}</strong></td>
                    <td>
                      {patient.telefon && (
                        <span className="icon-text-cell">
                          <FiPhone size={14} /> {patient.telefon}
                        </span>
                      )}
                    </td>
                    <td>
                      {patient.email && (
                        <span className="icon-text-cell">
                          <FiMail size={14} /> {patient.email}
                        </span>
                      )}
                    </td>
                    <td>{(() => { const d = new Date(patient.yaradilma_tarixi); const day = String(d.getDate()).padStart(2,'0'); const month = String(d.getMonth()+1).padStart(2,'0'); const year = d.getFullYear(); const wd = d.toLocaleDateString('az-AZ',{weekday:'long'}); return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)}`; })()}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-secondary btn-sm" onClick={() => fetchPatientDetail(patient.id)}>
                          <FiEye />
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(patient)}>
                          <FiEdit2 />
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(patient.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">
                    {loading ? 'Yüklənir...' : 'Heç bir xəstə tapılmadı'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="mobile-card-list mobile-only">
          {patients.length > 0 ? (
            patients.map(patient => (
              <div key={patient.id} className="mobile-patient-card">
                <div className="mobile-patient-top">
                  <strong>{patient.ad} {patient.soyad}</strong>
                  <div className="action-buttons">
                    <button className="btn btn-secondary btn-sm" onClick={() => fetchPatientDetail(patient.id)}>
                      <FiEye />
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(patient)}>
                      <FiEdit2 />
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(patient.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
                <div className="mobile-patient-info">
                  {patient.telefon && (
                    <span className="icon-text-cell"><FiPhone size={13} /> {patient.telefon}</span>
                  )}
                  {patient.email && (
                    <span className="icon-text-cell"><FiMail size={13} /> {patient.email}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              {loading ? 'Yüklənir...' : 'Heç bir xəstə tapılmadı'}
            </div>
          )}
        </div>
      </div>

      {/* Xəstə əlavə/redaktə modalı */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{formData.id ? 'Xəstəni Redaktə Et' : 'Yeni Xəstə'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Ad *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.ad}
                      onChange={e => setFormData({...formData, ad: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Soyad *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.soyad}
                      onChange={e => setFormData({...formData, soyad: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Telefon</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={formData.telefon}
                      onChange={e => setFormData({...formData, telefon: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Ünvan</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.unvan}
                    onChange={e => setFormData({...formData, unvan: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Qeyd</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={formData.qeyd}
                    onChange={e => setFormData({...formData, qeyd: e.target.value})}
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

      {/* Xəstə detalları modalı */}
      {showDetailModal && selectedPatient && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal modal-wide" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPatient.ad} {selectedPatient.soyad}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="patient-detail-info">
                <p><strong>Telefon:</strong> {selectedPatient.telefon || '-'}</p>
                <p><strong>Email:</strong> {selectedPatient.email || '-'}</p>
                <p><strong>Ünvan:</strong> {selectedPatient.unvan || '-'}</p>
                <p><strong>Qeyd:</strong> {selectedPatient.qeyd || '-'}</p>
                <p className="patient-total-debt">
                  Ümumi Borc: {formatMoney(selectedPatient.totalDebt)}
                </p>
              </div>

              <h4 className="section-title">Əməliyyat Tarixçəsi</h4>
              <table>
                <thead>
                  <tr>
                    <th>Təsvir</th>
                    <th>Məbləğ</th>
                    <th>Ödənildi</th>
                    <th>Borc</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPatient.transactions?.map(t => (
                    <tr key={t.id}>
                      <td>{t.tesvir}</td>
                      <td className="money">{formatMoney(t.mebleg)}</td>
                      <td className="money positive">{formatMoney(t.odenis_mebleg)}</td>
                      <td className="money negative">{formatMoney(t.borc_mebleg)}</td>
                      <td>
                        <span className={`badge badge-${
                          t.status === 'odenildi' ? 'success' : 
                          t.status === 'gecikdi' ? 'danger' : 'warning'
                        }`}>
                          {t.status === 'odenildi' ? 'Ödənildi' :
                           t.status === 'gecikdi' ? 'Gecikdi' : 'Gözləyir'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Patients;
