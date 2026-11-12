import { CSV_COLUMNS, getRequests, toCsvField } from "../../../lib/requests";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const requests = await getRequests();
    const columns = ["id", ...CSV_COLUMNS];

    const lines = [
      columns.join(","),
      ...requests.map((r) => columns.map((column) => toCsvField(r[column])).join(",")),
    ];

    return new Response(lines.join("\r\n") + "\r\n", {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="morrowlane-requests.csv"',
      },
    });
  } catch (error) {
    console.error("GET /api/export failed:", error);
    return Response.json(
      { error: "Could not export requests. Please try again." },
      { status: 500 }
    );
  }
}
