import { readFile } from "node:fs/promises";
import path from "node:path";

const SEED_PATH = path.join(process.cwd(), "data", "seed-requests.csv");

// Parses CSV text into an array of rows (each row an array of strings).
// Handles quoted fields containing commas, escaped quotes (""), and
// newlines inside quotes, plus both \n and \r\n line endings.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop blank lines.
  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

// Reads the seed CSV and returns request objects, newest first.
// Ids are assigned by position in the file (first data row = 1), so they
// stay the same every time the file is read.
export async function getRequests() {
  const text = await readFile(SEED_PATH, "utf8");
  const [header, ...dataRows] = parseCsv(text.replace(/^﻿/, ""));
  const columns = header.map((name) => name.trim());

  const requests = dataRows.map((values, index) => {
    const record = { id: index + 1 };
    columns.forEach((column, i) => {
      record[column] = (values[i] ?? "").trim();
    });
    return record;
  });

  return requests.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at) || b.id - a.id
  );
}
