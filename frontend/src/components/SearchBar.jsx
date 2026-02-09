import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiSearch, FiX, FiUser, FiClock, FiDollarSign, FiFileText, FiCalendar, FiPhone, FiArrowLeft } from 'react-icons/fi';

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setResults(null);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
        setShowResults(true);
      } catch (error) {
        console.error('Axtarış xətası:', error);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const openProfile = async (patientId) => {
    try {
      setLoadingProfile(true);
      setShowResults(false);
      const response = await axios.get(`/api/patients/${patientId}/profile`);
      setProfile(response.data);
      setSelectedPatient(patientId);
    } catch (error) {
      console.error('Profil yüklənmədi:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeProfile = () => {
    setSelectedPatient(null);
    setProfile(null);
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN'
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    const wd = d.toLocaleDateString('az-AZ',{weekday:'long'});
    return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)}`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2,'0');
    const month = String(d.getMonth()+1).padStart(2,'0');
    const year = d.getFullYear();
    const wd = d.toLocaleDateString('az-AZ',{weekday:'long'});
    const h = String(d.getHours()).padStart(2,'0');
    const m = String(d.getMinutes()).padStart(2,'0');
    return `${day}.${month}.${year}, ${wd.charAt(0).toUpperCase()+wd.slice(1)} ${h}:${m}`;
  };

  return (
    <>
      <div className="global-search" ref={searchRef}>
        <div className="global-search-input">
          <FiSearch />
          <input
            type="text"
            placeholder="Xəstə axtar (ad, soyad, telefon)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results && setShowResults(true)}
          />
          {query && (
            <button className="search-clear" onClick={() => { setQuery(''); setResults(null); setShowResults(false); }}>
              <FiX />
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && results && (
          <div className="search-dropdown">
            {results.patients?.length > 0 ? (
              results.patients.map(p => (
                <div key={p.id} className="search-result-item" onClick={() => openProfile(p.id)}>
                  <div className="search-result-main">
                    <FiUser />
                    <div>
                      <strong>{p.ad} {p.soyad}</strong>
                      {p.telefon && <span className="search-result-phone"><FiPhone size={12} /> {p.telefon}</span>}
                    </div>
                  </div>
                  <div className="search-result-info">
                    {p.totalDebt > 0 && (
                      <span className="money negative" style={{ fontSize: '0.8rem' }}>
                        Borc: {formatMoney(p.totalDebt)}
                      </span>
                    )}
                    {p.lastTransaction && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Son: {p.lastTransaction.tesvir}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="search-empty">Heç bir nəticə tapılmadı</div>
            )}
          </div>
        )}
      </div>

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <div className="modal-overlay" onClick={closeProfile}>
          <div className="modal profile-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <FiUser style={{ marginRight: '0.5rem' }} />
                {profile ? `${profile.ad} ${profile.soyad}` : 'Yüklənir...'}
              </h3>
              <button className="modal-close" onClick={closeProfile}>&times;</button>
            </div>

            {loadingProfile ? (
              <div className="modal-body"><div className="empty-state">Yüklənir...</div></div>
            ) : profile ? (
              <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {/* Patient Info */}
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <span className="profile-label">Telefon</span>
                    <span>{profile.telefon || '-'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">Email</span>
                    <span>{profile.email || '-'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">Ünvan</span>
                    <span>{profile.unvan || '-'}</span>
                  </div>
                  <div className="profile-info-item">
                    <span className="profile-label">Qeyd</span>
                    <span>{profile.qeyd || '-'}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="profile-stats">
                  <div className="profile-stat danger">
                    <span className="profile-stat-value">{formatMoney(profile.totalDebt)}</span>
                    <span className="profile-stat-label">Ümumi Borc</span>
                  </div>
                  <div className="profile-stat success">
                    <span className="profile-stat-value">{formatMoney(profile.totalPaid)}</span>
                    <span className="profile-stat-label">Ödənilmiş</span>
                  </div>
                  <div className="profile-stat primary">
                    <span className="profile-stat-value">{profile.appointments?.length || 0}</span>
                    <span className="profile-stat-label">Randevu</span>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="profile-section">
                  <h4><FiFileText /> Əməliyyat Tarixçəsi</h4>
                  {profile.transactions?.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Tarix</th>
                          <th>Təsvir</th>
                          <th>Məbləğ</th>
                          <th>Borc</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.transactions.map(t => (
                          <tr key={t.id}>
                            <td>{formatDate(t.tarix)}</td>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Əməliyyat yoxdur</p>
                  )}
                </div>

                {/* Payment History */}
                <div className="profile-section">
                  <h4><FiDollarSign /> Ödəniş Tarixçəsi</h4>
                  {profile.payments?.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Tarix</th>
                          <th>Məbləğ</th>
                          <th>Üsul</th>
                          <th>Qeyd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {profile.payments.map(p => (
                          <tr key={p.id}>
                            <td>{formatDateTime(p.tarix)}</td>
                            <td className="money positive">{formatMoney(p.mebleg)}</td>
                            <td>
                              {p.odenis_usulu === 'nagd' ? 'Nağd' :
                               p.odenis_usulu === 'kart' ? 'Kart' : 'Köçürmə'}
                            </td>
                            <td>{p.qeyd || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Ödəniş yoxdur</p>
                  )}
                </div>

                {/* Past Appointments */}
                {profile.appointments?.filter(a => a.tarix < new Date().toISOString().split('T')[0]).length > 0 && (
                  <div className="profile-section">
                    <h4><FiClock /> Keçmiş Randevular</h4>
                    <div className="profile-timeline">
                      {profile.appointments
                        .filter(a => a.tarix < new Date().toISOString().split('T')[0])
                        .map(a => (
                          <div key={a.id} className="timeline-item past">
                            <div className="timeline-date">{a.tarix} {a.saat}</div>
                            <div className="timeline-content">{a.tesvir}</div>
                            <span className={`badge badge-${a.status === 'tamamlandi' ? 'success' : a.status === 'legv_edildi' ? 'danger' : 'warning'}`}>
                              {a.status === 'tamamlandi' ? 'Tamamlandı' : a.status === 'legv_edildi' ? 'Ləğv edildi' : 'Planlanıb'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
}

export default SearchBar;
