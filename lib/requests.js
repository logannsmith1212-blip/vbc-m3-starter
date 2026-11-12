// Data access for service requests, backed by the Supabase "requests" table.
//
// SERVER ONLY. This file uses the Supabase secret key, which bypasses Row
// Level Security. The "server-only" import below makes the build fail if
// any browser code (such as app/page.js) ever tries to import this file.
import "server-only";
import { createClient } from "@supabase/supabase-js";

const TABLE = "requests";

export const CSV_COLUMNS = [
  "created_at",
  "requester_name",
  "location",
  "description",
  "priority",
  "status",
];

const SELECT_COLUMNS = ["id", ...CSV_COLUMNS].join(", ");

let client = null;

// Creates the Supabase client the first time it's needed, so a missing
// environment variable shows up as a clean 500 from the route instead of
// crashing the whole server at startup.
function getClient() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SECRET_KEY must both be set.");
  }

  client = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// Supabase returns timestamps like "2026-08-28T17:45:00+00:00". Convert
// them to the README's format, "2026-08-28T17:45:00Z".
function toApiRequest(row) {
  return {
    ...row,
    id: Number(row.id),
    created_at: new Date(row.created_at).toISOString().replace(".000Z", "Z"),
  };
}

// Throws a readable error (caught by the route's try/catch) if Supabase
// reports a problem.
function check(error, action) {
  if (error) {
    throw new Error(`Supabase ${action} failed: ${error.message}`);
  }
}

// Returns every request, newest first.
export async function getRequests() {
  const { data, error } = await getClient()
    .from(TABLE)
    .select(SELECT_COLUMNS)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  check(error, "read");
  return data.map(toApiRequest);
}

// Saves a new request with status "New" and returns it with the id and
// created_at the database assigned. Expects already-validated values.
export async function addRequest({ requester_name, location, description, priority }) {
  const { data, error } = await getClient()
    .from(TABLE)
    .insert({ requester_name, location, description, priority, status: "New" })
    .select(SELECT_COLUMNS)
    .single();

  check(error, "insert");
  return toApiRequest(data);
}

// Changes one request's status. Returns the updated request, or null if
// no request has that id.
export async function updateRequestStatus(id, status) {
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  const { data, error } = await getClient()
    .from(TABLE)
    .update({ status })
    .eq("id", id)
    .select(SELECT_COLUMNS)
    .maybeSingle();

  check(error, "update");
  return data ? toApiRequest(data) : null;
}

// Wraps a value in quotes if it contains a comma, quote, or line break,
// doubling any quotes inside it. Used by the CSV export.
export function toCsvField(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
