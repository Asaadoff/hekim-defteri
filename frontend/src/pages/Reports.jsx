import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FiTrendingUp, FiUsers, FiDollarSign, FiCalendar } from 'react-icons/fi';

function Reports() {
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [yearlyReport, setYearlyReport] = useState(null);
  const [topDebtors, setTopDebtors] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, [selectedYear, selectedMonth]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [monthly, yearly, debtors] = await Promise.all([
        axios.get(`/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`),
        axios.get(`/api/reports/yearly?year=${selectedYear}`),
        axios.get('/api/reports/top-debtors?limit=10')
      ]);
      
      setMonthlyReport(monthly.data);
      setYearlyReport(yearly.data);
      setTopDebtors(debtors.data);
    } catch (error) {
      console.error('Hesabatlar yüklənmədi:', error);
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

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];

  const chartData = yearlyReport?.monthlyRevenue?.map(item => ({
    name: monthNames[parseInt(item.ay) - 1]?.substring(0, 3),
    gelir: item.gelir || 0
  })) || [];

  const dailyChartData = monthlyReport?.dailyRevenue?.map(item => ({
    name: new Date(item.gun).getDate(),
    gelir: item.total || 0
  })) || [];

  if (loading) {
    return <div className="loading">Yüklənir...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Hesabatlar</h2>
        <div className="report-filters">
          <FiCalendar />
          <select 
            className="form-control report-filter-select"
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
          >
            {[2024, 2025, 2026, 2027].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select 
            className="form-control report-filter-select"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {monthNames.map((name, i) => (
              <option key={i} value={(i + 1).toString().padStart(2, '0')}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aylıq statistika */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">
            <FiTrendingUp />
          </div>
          <div className="stat-value">{monthlyReport?.newTransactions?.count || 0}</div>
          <div className="stat-label">Yeni Əməliyyat</div>
          <div className="stat-sub text-secondary">
            {formatMoney(monthlyReport?.newTransactions?.total)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <FiDollarSign />
          </div>
          <div className="stat-value">{monthlyReport?.receivedPayments?.count || 0}</div>
          <div className="stat-label">Alınan Ödəniş</div>
          <div className="stat-sub text-success">
            {formatMoney(monthlyReport?.receivedPayments?.total)}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon danger">
            <FiUsers />
          </div>
          <div className="stat-value">{monthlyReport?.pendingDebts?.count || 0}</div>
          <div className="stat-label">Açıq Borc</div>
          <div className="stat-sub text-danger">
            {formatMoney(monthlyReport?.pendingDebts?.total)}
          </div>
        </div>
      </div>

      {/* Qrafiklər */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">İllik Gəlir Qrafiki - {selectedYear}</h3>
          </div>
          <div className="chart-container">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Bar dataKey="gelir" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Məlumat yoxdur</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Günlük Gəlir - {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}</h3>
          </div>
          <div className="chart-container">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Line type="monotone" dataKey="gelir" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">Məlumat yoxdur</div>
            )}
          </div>
        </div>
      </div>

      {/* Ödəniş üsulları */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Ödəniş Üsullarına Görə</h3>
        </div>
        <div className="daily-summary-stats">
          {monthlyReport?.paymentsByMethod?.map((p, i) => (
            <div key={i} className="daily-summary-item">
              <p className="daily-summary-label">
                {p.odenis_usulu === 'nagd' ? 'Nağd' : p.odenis_usulu === 'kart' ? 'Kart' : 'Köçürmə'}
                {' '}({p.count} ədəd)
              </p>
              <p className="daily-summary-value">
                {formatMoney(p.total)}
              </p>
            </div>
          ))}
          {(!monthlyReport?.paymentsByMethod || monthlyReport.paymentsByMethod.length === 0) && (
            <p className="text-secondary">Bu ay ödəniş yoxdur</p>
          )}
        </div>
      </div>

      {/* Top borclu xəstələr */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Ən Çox Borclu Xəstələr</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Xəstə</th>
                <th>Telefon</th>
                <th>Açıq Əməliyyat</th>
                <th>Ümumi Borc</th>
              </tr>
            </thead>
            <tbody>
              {topDebtors.length > 0 ? (
                topDebtors.map((d, i) => (
                  <tr key={d.id}>
                    <td>{i + 1}</td>
                    <td><strong>{d.ad} {d.soyad}</strong></td>
                    <td>{d.telefon || '-'}</td>
                    <td>{d.unpaid_count}</td>
                    <td className="money negative">{formatMoney(d.total_borc)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-state">Borclu xəstə yoxdur</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* İllik cəmlər */}
      {yearlyReport?.totals && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{selectedYear} İllik Cəmi</h3>
          </div>
          <div className="yearly-totals-grid">
            <div className="yearly-total-item">
              <p className="yearly-total-label">Ümumi Əməliyyat</p>
              <p className="yearly-total-value">
                {yearlyReport.totals.transactions?.count || 0} ədəd
              </p>
              <p className="yearly-total-sub text-secondary">
                {formatMoney(yearlyReport.totals.transactions?.total)}
              </p>
            </div>
            <div className="yearly-total-item">
              <p className="yearly-total-label">Alınan Ödənişlər</p>
              <p className="yearly-total-value text-success">
                {yearlyReport.totals.payments?.count || 0} ədəd
              </p>
              <p className="yearly-total-sub text-success">
                {formatMoney(yearlyReport.totals.payments?.total)}
              </p>
            </div>
            <div className="yearly-total-item">
              <p className="yearly-total-label">Yeni Xəstələr</p>
              <p className="yearly-total-value">
                {yearlyReport.totals.newPatients?.count || 0} nəfər
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;
