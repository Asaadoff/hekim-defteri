# Həkim Borc Dəftəri

Həkimlər üçün xəstə borc və nisyə idarəetmə sistemi.

## Xüsusiyyətlər

- **Xəstə Qeydiyyatı**: Xəstə məlumatlarını əlavə edin, redaktə edin və axtarın
- **Borc/Nisyə İzləmə**: Əməliyyatları qeyd edin, borcları izləyin
- **Ödəniş Qeydləri**: Tam və qismən ödənişləri qeyd edin (nağd, kart, köçürmə)
- **Hesabatlar**: Aylıq/illik gəlir hesabatları, qrafiklər
- **Xatırlatmalar**: Gecikmiş ödənişlər və avtomatik xatırlatmalar

## Texnologiyalar

- **Backend**: Node.js, Express.js
- **Verilənlər Bazası**: SQLite (better-sqlite3)
- **Frontend**: React, Vite
- **Qrafiklər**: Recharts

## Quraşdırma

### 1. Backend

```bash
cd backend
npm install
npm start
```

Backend `http://localhost:3001` ünvanında işləyəcək.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:3000` ünvanında işləyəcək.

## API Endpoints

### Xəstələr
- `GET /api/patients` - Bütün xəstələr
- `POST /api/patients` - Yeni xəstə
- `GET /api/patients/:id` - Tək xəstə (borcları ilə)
- `PUT /api/patients/:id` - Xəstəni yenilə
- `DELETE /api/patients/:id` - Xəstəni sil

### Əməliyyatlar
- `GET /api/transactions` - Bütün əməliyyatlar
- `POST /api/transactions` - Yeni əməliyyat
- `GET /api/transactions/:id` - Tək əməliyyat
- `PUT /api/transactions/:id` - Əməliyyatı yenilə
- `DELETE /api/transactions/:id` - Əməliyyatı sil
- `GET /api/transactions/debtors/list` - Borclu xəstələr

### Ödənişlər
- `GET /api/payments` - Bütün ödənişlər
- `POST /api/payments` - Yeni ödəniş
- `DELETE /api/payments/:id` - Ödənişi sil
- `GET /api/payments/summary/daily` - Günlük cəmi

### Hesabatlar
- `GET /api/reports/monthly` - Aylıq hesabat
- `GET /api/reports/yearly` - İllik hesabat
- `GET /api/reports/top-debtors` - Ən çox borclu xəstələr
- `GET /api/reports/by-service` - Xidmətlərə görə hesabat

### Xatırlatmalar
- `GET /api/reminders` - Bütün xatırlatmalar
- `GET /api/reminders/today` - Bugünkü xatırlatmalar
- `GET /api/reminders/overdue` - Gecikmiş ödənişlər
- `POST /api/reminders` - Yeni xatırlatma
- `PUT /api/reminders/:id/mark-sent` - Göndərilmiş kimi işarələ

### Xidmətlər
- `GET /api/services` - Bütün xidmətlər
- `POST /api/services` - Yeni xidmət
- `PUT /api/services/:id` - Xidməti yenilə
- `DELETE /api/services/:id` - Xidməti sil

## Verilənlər Bazası

SQLite verilənlər bazası `backend/hekim.db` faylında saxlanılır.

### Cədvəllər:
- `patients` - Xəstələr
- `services` - Xidmətlər
- `transactions` - Əməliyyatlar/Nisyələr
- `payments` - Ödənişlər
- `reminders` - Xatırlatmalar

## Lisenziya

MIT
