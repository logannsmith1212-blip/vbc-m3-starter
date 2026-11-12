import { updateRequestStatus } from "../../../../lib/requests";

export const dynamic = "force-dynamic";

const STATUSES = ["New", "In Progress", "Complete"];

export async function PATCH(request, { params }) {
  try {
    const { id: rawId } = await params;

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "The request body must be valid JSON." },
        { status: 400 }
      );
    }

    const status = typeof body?.status === "string" ? body.status.trim() : "";
    if (!STATUSES.includes(status)) {
      return Response.json(
        { error: "Status must be New, In Progress, or Complete." },
        { status: 400 }
      );
    }

    const id = /^\d+$/.test(rawId) ? Number(rawId) : NaN;
    const updated = await updateRequestStatus(id, status);
    if (!updated) {
      return Response.json(
        { error: `No request found with id ${rawId}.` },
        { status: 404 }
      );
    }

    return Response.json({ request: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/requests/[id] failed:", error);
    return Response.json(
      { error: "Could not update the status. Please try again." },
      { status: 500 }
    );
  }
}
