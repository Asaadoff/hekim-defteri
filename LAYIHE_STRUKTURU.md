# Həkim Borc Dəftəri — Layihə Strukturu

## 📁 Qovluq Strukturu

```
Hekim/
├── backend/                 # API Server (Node.js + Express)
│   ├── server.js           # Əsas API endpoint-lər
│   ├── models/database.js  # LowDB verilənlər bazası
│   ├── hekim.json          # Məlumat faylı (gitignore-da)
│   └── package.json
│
├── frontend/               # Web İnterfeys (React + Vite)
│   ├── src/
│   │   ├── main.jsx       # React giriş nöqtəsi
│   │   ├── App.jsx        # Router və Layout
│   │   ├── App.css        # Əsas stillər
│   │   └── pages/
│   │       ├── Dashboard.jsx              # Ana səhifə, statistika
│   │       ├── ReceptionTransactions.jsx  # Randevu + Əməliyyatlar
│   │       ├── Patients.jsx               # Xəstələr siyahısı
│   │       ├── Payments.jsx               # Ödənişlər
│   │       ├── Reports.jsx                # Hesabatlar
│   │       └── Reminders.jsx              # Xatırlatmalar
│   ├── vite.config.js     # Vite konfiqurasiya (proxy)
│   └── package.json
│
├── desktop/               # Electron Desktop Tətbiqi
│   ├── main.js           # Electron əsas proses + Auto-updater
│   ├── server.js         # Desktop üçün Express server
│   ├── database.js       # Desktop verilənlər bazası + Backup
│   ├── frontend/         # Build olunmuş frontend (dist-dən kopyalanır)
│   ├── dist/             # Build artifacts (.exe faylları)
│   └── package.json      # Electron-builder konfiqurasiya
│
├── .gitignore
├── README.md
└── LAYIHE_STRUKTURU.md   # Bu fayl
```

---

## 🔧 Komponentlər

### 1. BACKEND (backend/)

**Fayl:** `backend/server.js`
**Port:** 3001
**Texnologiya:** Express.js, LowDB

| Endpoint | Metod | Təsvir |
|----------|-------|--------|
| `/api/patients` | GET, POST | Xəstələr siyahısı/əlavə |
| `/api/patients/:id` | GET, PUT, DELETE | Tək xəstə əməliyyatları |
| `/api/appointments` | GET, POST | Randevular |
| `/api/appointments/:id` | PUT, DELETE | Randevu redaktə/sil |
| `/api/transactions` | GET, POST | Əməliyyatlar (borc) |
| `/api/transactions/:id` | PUT, DELETE | Əməliyyat redaktə/sil |
| `/api/payments` | GET, POST | Ödənişlər |
| `/api/services` | GET, POST | Xidmətlər |
| `/api/reminders` | GET, POST | Xatırlatmalar |
| `/api/dashboard` | GET | Statistika |
| `/api/reports` | GET | Hesabatlar |

**Fayl:** `backend/models/database.js`
- LowDB ilə JSON faylda məlumat saxlama
- `patients`, `transactions`, `payments`, `appointments`, `services`, `reminders` kolleksiyaları

---

### 2. FRONTEND (frontend/)

**Texnologiya:** React 18, Vite 5, React Router v6, Axios, Recharts

#### Səhifələr:

| Fayl | Route | Təsvir |
|------|-------|--------|
| `Dashboard.jsx` | `/` | Ana səhifə, ümumi statistika, son əməliyyatlar |
| `ReceptionTransactions.jsx` | `/reception` | Randevu cədvəli + Əməliyyatlar |
| `Patients.jsx` | `/patients` | Xəstələr siyahısı, əlavə/redaktə |
| `Payments.jsx` | `/payments` | Bütün ödənişlər |
| `Reports.jsx` | `/reports` | Gəlir/borc hesabatları |
| `Reminders.jsx` | `/reminders` | Xatırlatmalar |

#### ReceptionTransactions.jsx — Əsas Komponentlər:

```
┌─────────────────────────────────────────────────────────┐
│ Qəbul və Əməliyyatlar                                   │
│ [Randevusuz Qəbul] [Yeni Randevu] [Yeni Əməliyyat]     │
├─────────────────────────────────────────────────────────┤
│ ◀ 09.02.2026, Bazar ertəsi ▶          [Bugünə qayıt]   │
├─────────────────────────────────────────────────────────┤
│ 0 Ümumi | 0 Tamamlanmış | 0 Gözləyən | 0 Ləğv          │
├─────────────────────────────────────────────────────────┤
│ Günün Cədvəli (randevular siyahısı)                     │
├─────────────────────────────────────────────────────────┤
│ Bütün Əməliyyatlar (borc cədvəli)                       │
└─────────────────────────────────────────────────────────┘
```

**State-lər:**
- `appointments` — Günün randevuları
- `transactions` — Bütün əməliyyatlar
- `patients` — Xəstələr siyahısı
- `services` — Xidmətlər siyahısı
- `selectedDate` — Seçilmiş tarix
- `showApptModal` — Randevu modalı
- `showWalkInModal` — Randevusuz qəbul modalı
- `showTxModal` — Yeni əməliyyat modalı
- `showPayModal` — Ödəniş modalı
- `showQuickPatient` — Sürətli xəstə əlavə rejimi

**Funksiyalar:**
- `fetchAppointments()` — Randevuları yüklə
- `fetchTransactions()` — Əməliyyatları yüklə
- `fetchPatients()` — Xəstələri yüklə
- `handleQuickPatientCreate()` — Sürətli xəstə yarat
- `handleReceptionSubmit()` — Qəbul tamamla
- `handleStatusChange()` — Randevu statusunu dəyiş
- `openPayModal()` — Ödəniş modalını aç

---

### 3. DESKTOP (desktop/)

**Texnologiya:** Electron 28, electron-builder 24, electron-updater 6

#### main.js — Əsas Proses:
- `createWindow()` — Pəncərə yarat
- `setupAutoUpdater()` — Avtomatik yeniləmə qur
- `createBackup()` — Yeniləmədən əvvəl backup
- Update dialog-ları (Yeniləmə mövcuddur, Yeniləmə hazırdır)

#### database.js — Məlumat Bazası:
- `createBackup()` — Backup yarat (son 20-ni saxla)
- `restoreBackup(fileName)` — Backup-dan bərpa
- `listBackups()` — Backup siyahısı
- Məlumat yeri: `%APPDATA%/HekimBorcDefteri/hekim.json`

#### server.js — API Endpoints:
- Bütün backend endpoint-ləri + 
- `/api/update/*` — Yeniləmə API
- `/api/backups/*` — Backup API
- `/api/app/version` — Versiya

#### package.json — Build Konfiqurasiya:
```json
{
  "name": "hekim-borc-defteri",
  "version": "1.0.0",
  "build": {
    "appId": "com.hekim.borcdefteri",
    "productName": "Hekim Borc Defteri",
    "publish": {
      "provider": "github",
      "owner": "Asaadoff",
      "repo": "hekim-defteri"
    }
  }
}
```

---

## 🎨 Stillər (frontend/src/App.css)

| Class | Təsvir |
|-------|--------|
| `.sidebar` | Sol panel navigasiya |
| `.main-content` | Əsas məzmun sahəsi |
| `.card` | Kart komponenti |
| `.btn`, `.btn-primary`, `.btn-success` | Düymələr |
| `.modal`, `.modal-overlay` | Modal pəncərələr |
| `.form-control`, `.form-group` | Form elementləri |
| `.badge` | Status nişanları |
| `.table-container`, `table` | Cədvəllər |
| `.date-nav-card` | Tarix naviqasiyası |
| `.reception-stats` | Statistika kartları |
| `.reception-list`, `.reception-item` | Randevu siyahısı |

---

## 🔄 GitHub & Auto-Update

**Repository:** `github.com/Asaadoff/hekim-defteri` (private)
**Token:** Classic token (`ghp_...`) — repo scope

**Yeniləmə axını:**
1. Kod dəyişikliyi → `git add -A && git commit -m "..." && git push`
2. Versiya artır → `package.json` → `"version": "1.0.1"`
3. Release yarat → `cd desktop && npm run release`
4. GitHub-a yüklənir → Auto-updater tərəfindən yoxlanır
5. İstifadəçidə dialog açılır → Yeniləmə yüklənir

---

## 🛠️ Tez-Tez Lazım Olan Əməliyyatlar

### Development serverlərini başlat:
```powershell
cd backend && npm start          # Port 3001
cd frontend && npm run dev       # Port 3000
```

### Desktop tətbiqini başlat:
```powershell
cd desktop && npm start
```

### Build et və release yarat:
```powershell
cd frontend && npm run build     # Frontend build
xcopy dist\* ..\desktop\frontend\ /E /Y  # Desktop-a kopyala
cd ..\desktop && npm run release # GitHub-a yüklə
```

### Git əməliyyatları:
```powershell
git add -A
git commit -m "Dəyişiklik təsviri"
git push origin main
```

---

## 📋 Dəyişiklik Bələdçisi

### Yeni səhifə əlavə etmək:
1. `frontend/src/pages/YeniSehife.jsx` yarat
2. `frontend/src/App.jsx`-da route əlavə et
3. Sidebar-da link əlavə et

### Yeni API endpoint əlavə etmək:
1. `backend/server.js`-da endpoint yaz
2. `backend/models/database.js`-da funksiya əlavə et
3. `desktop/server.js`-da eyni endpoint-i əlavə et

### Modal əlavə etmək:
1. State əlavə et: `const [showNewModal, setShowNewModal] = useState(false)`
2. Modal JSX əlavə et (mövcud modallardan nümunə götür)
3. Açma funksiyası yaz

### Statistika dəyişmək:
- `ReceptionTransactions.jsx` → `dayStats` obyektini tap
- Status filterləməsini dəyiş

### Stil dəyişmək:
- `frontend/src/App.css`-da class tap və dəyiş

---

## 📞 Əlaqə & Dəstək

Bu sənəd layihənin strukturunu izah edir. Hər hansı dəyişiklik lazım olanda bu faylı mənə göndər, dəyişikliyi edərəm.
