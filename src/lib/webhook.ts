const WEBHOOK_URL = process.env.WEBHOOK_URL;

interface WebhookPayload {
  type: string;
  key?: string;
  robloxNick?: string;
  hwid?: string;
  ip?: string;
  message?: string;
  timestamp?: string;
}

async function sendWithRetry(payload: WebhookPayload, attempts = 3, delay = 1000): Promise<void> {
  if (!WEBHOOK_URL) return;

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "Apex Keys",
          embeds: [
            {
              title: `[${payload.type.toUpperCase()}]`,
              color: typeToColor(payload.type),
              fields: buildFields(payload),
              timestamp: payload.timestamp ?? new Date().toISOString(),
            },
          ],
        }),
      });

      if (res.ok) return;
      if (res.status === 429) {
        // Rate limited pelo Discord — espera mais
        await sleep(delay * 3);
        continue;
      }
    } catch {
      // Rede falhou — tenta de novo
    }

    if (i < attempts - 1) await sleep(delay * (i + 1));
  }
}

function buildFields(p: WebhookPayload) {
  const fields = [];
  if (p.key)        fields.push({ name: "Key",         value: `\`${p.key}\``,     inline: true });
  if (p.robloxNick) fields.push({ name: "Nick Roblox", value: p.robloxNick,       inline: true });
  if (p.hwid)       fields.push({ name: "HWID",        value: `\`${p.hwid}\``,    inline: false });
  if (p.ip)         fields.push({ name: "IP",          value: `\`${p.ip}\``,      inline: true });
  if (p.message)    fields.push({ name: "Detalhe",     value: p.message,          inline: false });
  return fields;
}

function typeToColor(type: string): number {
  const map: Record<string, number> = {
    execution:        0x00ff88,
    create:           0x5555ff,
    delete:           0xff4444,
    restore:          0xffaa00,
    invalid_attempt:  0xff8800,
    blocked_attempt:  0xff0000,
    admin_action:     0x888888,
  };
  return map[type] ?? 0xffffff;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const webhook = {
  send: (payload: WebhookPayload) => {
    // Dispara sem bloquear a resposta HTTP
    sendWithRetry(payload).catch(() => {});
  },
};
