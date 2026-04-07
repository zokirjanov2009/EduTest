# 🎓 EduTest — Mustaqil Ishlarni AI Bilan Tekshirish

## Tezkor Ishga Tushirish

### 1. Backend (Railway)
1. GitHub ga push qiling
2. [railway.app](https://railway.app) → New Project → GitHub repo
3. Root Directory: `backend`
4. Environment Variables:
```
DATABASE_URL=postgresql://...neon.tech/edutest?sslmode=require
JWT_SECRET=<64 belgili random matn>
JWT_REFRESH_SECRET=<boshqa 64 belgili random matn>
JWT_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=90d
CLIENT_URLS=https://sizning.vercel.app,http://localhost:3000
GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
NODE_ENV=production
```

### 2. Frontend (Vercel)
1. [vercel.com](https://vercel.com) → New Project → GitHub repo
2. Root Directory: `frontend`
3. Environment Variables:
```
VITE_API_URL=https://sizning-backend.up.railway.app/api
```

### 3. Admin akkaunt
Railway terminal:
```bash
node prisma/seed.js
```
- Email: `admin@edutest.uz`
- Parol: `admin123`

## Lokal Ishga Tushirish
```bash
# Backend
cd backend && npm install
cp .env.example .env  # .env ni to'ldiring
npx prisma migrate dev
node prisma/seed.js
npm run dev

# Frontend
cd frontend && npm install
cp .env.example .env.local
npm run dev
```

## Texnologiyalar
- **Backend**: Node.js + Express + PostgreSQL + Prisma
- **Frontend**: React + Vite + Tailwind CSS
- **AI**: Groq (llama3-8b)
- **Fayllar**: Cloudinary (yoki lokal)
- **Deploy**: Railway + Vercel
