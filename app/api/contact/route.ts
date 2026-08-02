import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, sessionType, message } = body ?? {};
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "Name, email, and message are required." },
      { status: 400 }
    );
  }
  console.log("New inquiry:", { name, email, phone, sessionType, message });
  return NextResponse.json({ success: true });
}
