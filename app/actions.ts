"use server";

/**
 * Table requests, posted to the Hotel Palacio dashboard.
 *
 * Runs on the server: the dashboard's address stays out of the client bundle
 * and there is no CORS to negotiate, because the browser only ever talks to
 * this app.
 *
 * `submitReservation` already existed in content/index.ts but nothing called
 * it — there was no form on the site. This is the other half.
 */

import { submitReservation as post } from "@/content";

export type ReservationState = {
  status: "idle" | "sent" | "error";
  message?: string;
};

/** Blank fields are absent, not empty strings. */
function field(data: FormData, key: string): string | undefined {
  const v = data.get(key);
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

export async function requestTable(
  _prev: ReservationState,
  data: FormData
): Promise<ReservationState> {
  const name = field(data, "name");
  const email = field(data, "email");
  const phone = field(data, "phone");

  // The API enforces the same rule; checking here saves a round trip.
  if (!name) {
    return { status: "error", message: "Please tell us your name." };
  }
  if (!email && !phone) {
    return {
      status: "error",
      message: "Leave an email or a phone number so we can confirm.",
    };
  }

  const partyRaw = field(data, "partySize");
  const partySize = partyRaw ? Number(partyRaw) : undefined;

  const ok = await post({
    name,
    email,
    phone,
    partySize: Number.isFinite(partySize) ? partySize : undefined,
    wantedFor: field(data, "wantedFor"),
    occasion: field(data, "occasion"),
    message: field(data, "message"),
  });

  if (!ok) {
    // Never tell a guest their table is requested when it is not. Noya's
    // public phone number is still a placeholder in content/noya.ts, so there
    // is no number to fall back to here yet.
    return {
      status: "error",
      message:
        "We could not send that just now. Please try again in a moment, or message us on Instagram.",
    };
  }

  return {
    status: "sent",
    message: "Noted — we will come back to you to confirm.",
  };
}
