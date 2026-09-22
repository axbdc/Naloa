import { NextResponse } from "next/server";
import { revokeShare } from "@/lib/shares";

export async function DELETE(_req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  await revokeShare(token);
  return NextResponse.json({ ok: true });
}
