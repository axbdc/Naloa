import { NextRequest, NextResponse } from "next/server";
import { createLead, type EquipmentItem, type ServiceType } from "@/lib/db";
import { formatDateRangeShort } from "@/lib/dates";

const SERVICE_TYPE_VALUES = new Set(["fotografia", "video", "ambos", "drone", "outro"]);

function str(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function equipmentFromInput(v: unknown): EquipmentItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((item) => ({ item: item.trim(), checked: false }));
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const name = str(body?.name);
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  const start_date = str(body?.start_date);
  const end_date = str(body?.end_date);
  const local = str(body?.local);
  const angle = str(body?.angle);
  const link = str(body?.link);
  const start_time = str(body?.start_time);
  const end_time = str(body?.end_time);
  const team = str(body?.team);
  const service_type_raw = str(body?.service_type);
  const service_type: ServiceType | null =
    service_type_raw && SERVICE_TYPE_VALUES.has(service_type_raw) ? (service_type_raw as ServiceType) : null;
  const budget = typeof body?.budget === "number" && !Number.isNaN(body.budget) ? body.budget : null;
  const equipment = equipmentFromInput(body?.equipment);

  const date_label = start_date ? formatDateRangeShort(start_date, end_date) : null;

  const lead = await createLead({
    name,
    section: "manual",
    start_date,
    end_date,
    date_label,
    local,
    angle,
    link,
    start_time,
    end_time,
    team,
    service_type,
    budget,
    equipment,
  });

  return NextResponse.json({ lead });
}
