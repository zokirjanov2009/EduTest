const net = require("net");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseDb(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // postgres://user:pass@host:5432/db?schema=public
    return {
      host: u.hostname,
      port: Number(u.port || 5432),
    };
  } catch {
    return null;
  }
}

async function canConnect(host, port, timeoutMs) {
  return await new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      try { socket.destroy(); } catch {}
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.on("connect", () => done(true));
    socket.on("timeout", () => done(false));
    socket.on("error", () => done(false));
  });
}

async function main() {
  const cfg = parseDb(process.env.DATABASE_URL);
  if (!cfg) {
    console.error("❌ DATABASE_URL topilmadi yoki noto'g'ri formatda.");
    process.exit(1);
  }

  const maxAttempts = Number(process.env.DB_WAIT_ATTEMPTS || 30);
  const delayMs = Number(process.env.DB_WAIT_DELAY_MS || 2000);
  const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS || 1500);

  console.log(`⏳ DB kutilyapti: ${cfg.host}:${cfg.port} (attempts=${maxAttempts})`);

  for (let i = 1; i <= maxAttempts; i++) {
    const ok = await canConnect(cfg.host, cfg.port, timeoutMs);
    if (ok) {
      console.log("✅ DB tayyor.");
      return;
    }
    console.log(`… DB tayyor emas (${i}/${maxAttempts}), ${delayMs}ms kutamiz`);
    await sleep(delayMs);
  }

  console.error("❌ DB ulanib bo'lmadi. DATABASE_URL va Railway Postgres'ni tekshiring.");
  process.exit(1);
}

main();

