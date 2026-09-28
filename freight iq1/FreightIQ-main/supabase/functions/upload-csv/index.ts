import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const UPLOAD_PASSCODE = Deno.env.get("UPLOAD_PASSCODE");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function parseCSV(csv: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i++;
      }

      row.push(field.trim());
      field = "";

      if (row.some((value) => value !== "")) {
        rows.push(row);
      }

      row = [];
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field.trim());

    if (row.some((value) => value !== "")) {
      rows.push(row);
    }
  }

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());

  return rows.slice(1).map((values) => {
    const record: Record<string, string> = {};

    headers.forEach((header, index) => {
      record[header] = values[index] ?? "";
    });

    return record;
  });
}

function emptyToNull(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function emptyToEmpty(value: string | undefined) {
  if (value === undefined || value.trim() === "") {
    return "";
  }

  return value.trim();
}

function numericOrNull(value: string | undefined) {
  const cleaned = emptyToNull(value);

  if (cleaned === null) {
    return null;
  }

  const number = Number(cleaned.replace(/,/g, ""));

  return Number.isFinite(number) ? number : null;
}

async function upsertInBatches(
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
) {
  const batchSize = 500;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);

    const { error } = await supabase
      .from(table)
      .upsert(batch, {
        onConflict,
        ignoreDuplicates: false,
      });

    if (error) {
      throw new Error(`Failed to upload ${table}: ${error.message}`);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests are allowed." }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!UPLOAD_PASSCODE) {
      return new Response(
        JSON.stringify({ error: "Upload passcode is not configured." }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const formData = await req.formData();

    const passcode = formData.get("passcode");
    const file = formData.get("file");
    const type = formData.get("type");

    if (typeof passcode !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing passcode." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (passcode !== UPLOAD_PASSCODE) {
      return new Response(
        JSON.stringify({ error: "Invalid passcode." }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (!(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: "Missing CSV file." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (type !== "vessel" && type !== "berth") {
      return new Response(
        JSON.stringify({
          error: 'Type must be either "vessel" or "berth".',
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const csvText = await file.text();
    const parsedRows = parseCSV(csvText);

    if (parsedRows.length === 0) {
      return new Response(
        JSON.stringify({ error: "CSV contains no data rows." }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (type === "vessel") {
      const rows = parsedRows.map((row) => ({
        snapshot_date: emptyToNull(row.snapshot_date),
        port: emptyToNull(row.port),
        status: emptyToNull(row.status),
        berth_name: emptyToEmpty(row.berth_name),
        vessel_name: emptyToNull(row.vessel_name),
        vessel_type: emptyToNull(row.vessel_type),
        vessel_dimensions: emptyToNull(row.vessel_dimensions),
        cargo: emptyToEmpty(row.cargo),
        cargo_category: emptyToNull(row.cargo_category),
        quantity_mts: emptyToNull(row.quantity_mts),
        quantity_mts_numeric: numericOrNull(row.quantity_mts_numeric),
        direction: emptyToNull(row.direction),
        arrival_or_eta: emptyToNull(row.arrival_or_eta),
        berth_or_etb: emptyToNull(row.berth_or_etb),
        etc_or_etcd: emptyToNull(row.etc_or_etcd),
        origin_destination: emptyToNull(row.origin_destination),
        shipper_receiver: emptyToNull(row.shipper_receiver),
        agent: emptyToNull(row.agent),
        remarks: emptyToNull(row.remarks),
      }));

      const uniqueRows = new Map<string, Record<string, unknown>>();

      for (const row of rows) {
        const key = [
          row.vessel_name,
          row.port,
          row.snapshot_date,
          row.berth_name,
          row.cargo,
        ].join("|");

        uniqueRows.set(key, row);
      }

      const deduplicatedRows = Array.from(uniqueRows.values());

      await upsertInBatches(
        "vessel_snapshots",
        deduplicatedRows,
        "vessel_name,port,snapshot_date,berth_name,cargo",
      );

      return new Response(
        JSON.stringify({
          success: true,
          type: "vessel",
          rows_processed: rows.length,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const rows = parsedRows.map((row) => ({
      snapshot_date: emptyToNull(row.snapshot_date),
      port: emptyToNull(row.port),
      berth_name: emptyToNull(row.berth_name),
      status: emptyToNull(row.status),
      remarks: emptyToNull(row.remarks),
    }));

    await upsertInBatches(
      "berth_operations",
      rows,
      "snapshot_date,port,berth_name",
    );

    return new Response(
      JSON.stringify({
        success: true,
        type: "berth",
        rows_processed: rows.length,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error
          ? error.message
          : "Unexpected server error.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});