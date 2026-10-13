// Vercel Serverless Function: saytdagi formani Telegram botga yuboradi.
// Vercel → Project → Settings → Environment Variables:
//   TELEGRAM_BOT_TOKEN = 123456:ABC...   (BotFather bergan token)
//   TELEGRAM_CHAT_ID   = -100123... yoki 123456789  (bir nechta bo'lsa vergul bilan)

const esc = (s = "") =>
  String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const clip = (s, n) => String(s || "").trim().slice(0, n);

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chats = (process.env.TELEGRAM_CHAT_ID || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!token || !chats.length) return res.status(500).json({ ok: false, error: "config" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
  b = b || {};

  // Spam-bot tuzog'i: yashirin maydon to'ldirilgan bo'lsa jim qabul qilamiz
  if (b.website) return res.status(200).json({ ok: true });

  const first = clip(b.first, 60);
  const last = clip(b.last, 60);
  const phone = clip(b.phone, 20);
  const service = clip(b.service, 80);
  const goal = clip(b.goal, 1000);

  if (first.length < 2 || last.length < 2 || !/^\+998\d{9}$/.test(phone) || goal.length < 5) {
    return res.status(400).json({ ok: false, error: "validation" });
  }

  const time = new Date().toLocaleString("uz-UZ", { timeZone: "Asia/Tashkent" });
  const text =
    `🆕 <b>Yangi ariza — Icanuz xizmatlar sayti</b>\n\n` +
    `👤 <b>Ism:</b> ${esc(first)} ${esc(last)}\n` +
    `📞 <b>Telefon:</b> ${esc(phone)}\n` +
    `🧩 <b>Xizmat:</b> ${esc(service || "Tanlanmagan")}\n` +
    `🎯 <b>Maqsad:</b> ${esc(goal)}\n\n` +
    `🕒 ${esc(time)}`;

  try {
    const results = await Promise.all(
      chats.map((chat_id) =>
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id, text, parse_mode: "HTML", disable_web_page_preview: true }),
        }).then((r) => r.ok)
      )
    );
    if (!results.some(Boolean)) return res.status(502).json({ ok: false });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ ok: false });
  }
}
