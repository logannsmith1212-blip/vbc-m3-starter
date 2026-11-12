import { getRequests } from "../../../lib/requests";

export const dynamic = "force-dynamic";

// "YYYY-MM" in UTC, so the month doesn't shift with the server's time zone.
function monthKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 7);
}

export async function GET() {
  try {
    const requests = await getRequests();
    const open = requests.filter((r) => r.status !== "Complete");

    // Requests are newest first, so the first one sets the reporting month.
    const latestMonth = requests.length ? monthKey(requests[0].created_at) : null;

    const summary = {
      open_requests: open.length,
      urgent_open: open.filter((r) => r.priority === "Urgent").length,
      completed_this_month: requests.filter(
        (r) => r.status === "Complete" && monthKey(r.created_at) === latestMonth
      ).length,
    };

    return Response.json(summary, { status: 200 });
  } catch (error) {
    console.error("GET /api/summary failed:", error);
    return Response.json(
      { error: "Could not load the summary. Please try again." },
      { status: 500 }
    );
  }
}
