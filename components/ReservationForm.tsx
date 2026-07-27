"use client";

import { useActionState } from "react";
import { requestTable, type ReservationState } from "@/app/actions";

const INITIAL: ReservationState = { status: "idle" };

export default function ReservationForm() {
  // useActionState returns pending as a third value in this version.
  const [state, formAction, pending] = useActionState(requestTable, INITIAL);

  if (state.status === "sent") {
    return (
      <div className="form form--sent" role="status">
        <p className="title-m">{state.message}</p>
      </div>
    );
  }

  return (
    <form className="form" action={formAction}>
      <div className="form__row">
        <label>
          Name
          <input name="name" type="text" required autoComplete="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" />
        </label>
      </div>
      <div className="form__row">
        <label>
          Phone
          <input name="phone" type="tel" autoComplete="tel" />
        </label>
        <label>
          Guests
          <input name="partySize" type="number" min={1} max={40} placeholder="2" />
        </label>
      </div>
      <div className="form__row">
        <label>
          Night
          <input name="wantedFor" type="datetime-local" />
        </label>
        <label>
          Occasion
          <input name="occasion" type="text" placeholder="Birthday, buy-out…" />
        </label>
      </div>
      <label>
        Anything we should know
        <textarea name="message" rows={3} />
      </label>

      {/* Announced, not merely coloured — a lost booking is the expensive
          failure on this page. */}
      {state.status === "error" && (
        <p className="form__error" role="alert">
          {state.message}
        </p>
      )}

      <p className="micro muted">
        An email or a phone number is enough — we need one way to confirm.
      </p>

      <button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Request a table"}
      </button>
    </form>
  );
}
