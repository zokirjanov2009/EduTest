# Root Dockerfile (Railway uchun qulay): backend'ni build/run qiladi.
# Agar Railway servisida Root Directory ni `backend` qilib qo'ysangiz, bu fayl shart emas,
# lekin rootdan build qilinsa ham yiqilmasligi uchun qo'shildi.

FROM node:20-alpine
WORKDIR /app

# Prisma Alpine uchun
RUN apk add --no-cache openssl libc6-compat

# Faqat backend dependency'lar
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Backend kod
COPY backend ./backend
RUN cd backend && npx prisma generate

ENV NODE_ENV=production
EXPOSE 5000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node src/server.js"]

