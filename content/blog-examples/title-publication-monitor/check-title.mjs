import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const registry = process.env.TITLE_MONITOR_REGISTRY?.trim().toUpperCase();
const dryRun = process.env.TITLE_MONITOR_DRY_RUN === "true";
const stateDirectory = ".title-monitor-state";
const statePath = path.join(stateDirectory, "state.json");

function decodeText(html) {
  const entities = {
    nbsp: " ", amp: "&", quot: '"', apos: "'",
    aacute: "á", eacute: "é", iacute: "í", oacute: "ó",
    uacute: "ú", ntilde: "ñ", uuml: "ü",
  };
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, number) => {
      const point = Number(number);
      return point <= 0x10ffff ? String.fromCodePoint(point) : _;
    })
    .replace(/&([a-z]+);/gi, (match, name) => {
      const value = entities[name.toLowerCase()];
      if (!value) return match;
      return name[0] === name[0].toUpperCase() ? value.toUpperCase() : value;
    })
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchRecord() {
  const url = new URL("https://www.lagaceta.gob.ni/consultas");
  url.searchParams.set("t", "1");
  url.searchParams.set("search", registry);

  const response = await fetch(url, {
    headers: { "User-Agent": "personal-title-monitor/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("La Gaceta respondió HTTP " + response.status);

  const html = await response.text();
  const rows = [...html.matchAll(/<tr class="consulta-row">([\s\S]*?)<\/tr>/gi)];
  const records = rows.map((row) =>
    [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)]
      .map((cell) => decodeText(cell[1])),
  );
  const cells = records.find((row) =>
    row.length >= 9 && row[0].toUpperCase() === registry,
  );
  if (!cells || !cells[3] || !cells[8]) {
    throw new Error("No se confirmó el registro. Revisá la consulta oficial y el formato HTML.");
  }

  return {
    registry: cells[0],
    receivedAt: cells[1],
    holder: cells[3],
    gazetteNumber: cells[4],
    publicationDate: cells[6],
    status: cells[8],
  };
}

async function loadPreviousRecord() {
  try {
    const saved = JSON.parse(await readFile(statePath, "utf8"));
    if (!saved || typeof saved !== "object" || typeof saved.registry !== "string") {
      throw new Error("El archivo de estado no tiene el formato esperado.");
    }
    return saved;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function notifyTelegram(record) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) throw new Error("Faltan las credenciales de Telegram.");

  const message = [
    "Monitor personal de títulos — La Gaceta",
    "Registro: " + record.registry,
    "Titular: " + record.holder,
    "Estado: " + record.status,
    "Ingreso: " + record.receivedAt,
    "Gaceta: " + record.gazetteNumber,
    "Publicación: " + record.publicationDate,
    "Comprobación: " + new Date().toLocaleString("es-NI", {
      timeZone: "America/Managua",
    }),
    "Confirmá los datos en https://www.lagaceta.gob.ni/consultas",
  ].join("\n");

  const response = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: message }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("Telegram respondió HTTP " + response.status);
  const result = await response.json();
  if (!result.ok) throw new Error("Telegram no confirmó el envío.");
}

async function main() {
  if (!registry || !/^\d{4}-TP\d+$/.test(registry)) {
    throw new Error("Configurá TITLE_MONITOR_REGISTRY con tu código oficial AÑO-TPnúmero.");
  }
  const current = await fetchRecord();
  if (dryRun) {
    console.log(current);
    console.log("Prueba de consulta: no se envió Telegram ni se guardó estado.");
    return;
  }

  const previous = await loadPreviousRecord();
  const changed = !previous || Object.keys(current).some(
    (field) => current[field] !== previous[field],
  );
  if (changed) {
    await notifyTelegram(current);
    await mkdir(stateDirectory, { recursive: true });
    await writeFile(statePath, JSON.stringify(current, null, 2) + "\n");
    console.log("Aviso enviado y estado guardado.");
  } else {
    console.log("Sin cambios desde la última consulta.");
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
