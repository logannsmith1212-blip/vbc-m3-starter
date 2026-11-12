import { addRequest, getRequests } from "../../../lib/requests";

export const dynamic = "force-dynamic";

const LOCATIONS = ["Minneapolis", "Chicago", "Denver", "Austin"];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const MAX_DESCRIPTION_LENGTH = 500;

const REQUIRED_FIELDS = [
  ["requester_name", "Requester name"],
  ["location", "Location"],
  ["description", "Description"],
  ["priority", "Priority"],
];

// Checks the request body against the README's rules. Returns
// { error } on the first problem found, or { values } with every field
// trimmed and ready to save.
function validateNewRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "The request body must be a JSON object." };
  }

  const values = {};
  for (const [field, label] of REQUIRED_FIELDS) {
    const raw = body[field];
    if (typeof raw !== "string" || raw.trim() === "") {
      return { error: `${label} is required.` };
    }
    values[field] = raw.trim();
  }

  if (!LOCATIONS.includes(values.location)) {
    return { error: "Location must be Minneapolis, Chicago, Denver, or Austin." };
  }
  if (!PRIORITIES.includes(values.priority)) {
    return { error: "Priority must be Low, Medium, High, or Urgent." };
  }
  if (values.description.length > MAX_DESCRIPTION_LENGTH) {
    return {
      error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer (it is ${values.description.length}).`,
    };
  }

  return { values };
}

export async function GET() {
  try {
    const requests = await getRequests();
    return Response.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("GET /api/requests failed:", error);
    return Response.json(
      { error: "Could not load requests. Please try again." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "The request body must be valid JSON." },
        { status: 400 }
      );
    }

    const { error, values } = validateNewRequest(body);
    if (error) {
      return Response.json({ error }, { status: 400 });
    }

    const created = await addRequest(values);
    return Response.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/requests failed:", error);
    return Response.json(
      { error: "Could not save the request. Please try again." },
      { status: 500 }
    );
  }
}
