# 🚀 EduTest — Railway + Vercel Deploy Yo'riqnomasi

## 1-QADAM: GitHub

```bash
git init
git add .
git commit -m "EduTest initial commit"
# GitHub.com da repo yarating, so'ng:
git remote add origin https://github.com/USERNAME/edutest.git
git branch -M main
git push -u origin main
```

---

## 2-QADAM: Neon.tech (Database)

1. [neon.tech](https://neon.tech) → Sign up → New Project
2. **Connection string** ni ko'chirib oling:
   ```
   postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```

---

## 3-QADAM: Groq API Key

1. [console.groq.com](https://console.groq.com) → Sign up
2. API Keys → Create → Ko'chiring

---

## 4-QADAM: Cloudinary (fayl saqlash)

1. [cloudinary.com](https://cloudinary.com) → Sign up
2. Dashboard dan oling:
   - Cloud name
   - API Key
   - API Secret

---

## 5-QADAM: Railway (Backend)

1. [railway.app](https://railway.app) → Login with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Reponi tanlang
4. **Settings → General → Root Directory** = `backend`
5. **Variables** bo'limiga o'ting va quyidagilarni qo'shing:

```
DATABASE_URL        = postgresql://...neon.tech/neondb?sslmode=require
JWT_SECRET          = <node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_REFRESH_SECRET  = <yuqoridagi buyruqni qayta ishlatib yangi key>
JWT_EXPIRES_IN      = 30d
JWT_REFRESH_EXPIRES_IN = 90d
NODE_ENV            = production
GROQ_API_KEY        = gsk_...
CLOUDINARY_CLOUD_NAME = ...
CLOUDINARY_API_KEY  = ...
CLOUDINARY_API_SECRET = ...
CLIENT_URLS         = https://SIZNING-VERCEL-URL.vercel.app,http://localhost:3000
```

6. Deploy tugashini kuting → **URL** ni ko'chirib oling
   (masalan: `https://edutest-backend-production.up.railway.app`)

7. **Deploy** bo'limida terminal oching:
```bash
node prisma/seed.js
```

---

## 6-QADAM: Vercel (Frontend)

1. [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. **Root Directory** = `frontend`
3. **Environment Variables**:
```
VITE_API_URL = https://edutest-backend-production.up.railway.app/api
```
4. Deploy!

---

## 7-QADAM: CORS ni yangilang

Railway Variables da `CLIENT_URLS` ni Vercel URL bilan yangilang:
```
CLIENT_URLS = https://sizning-sayt.vercel.app,http://localhost:3000
```

---

## Kirish Ma'lumotlari

```
Email:  admin@edutest.uz
Parol:  admin123
```

⚠️ **Birinchi kirishdan keyin parolni o'zgartiring!**

---

## Tekshirish

Backend ishlayaptimi:
```
https://sizning-backend.up.railway.app/health
```

Natija: `{"success":true,"message":"EduTest API ishlayapti!"}`
