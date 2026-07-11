"use client";

import { useState } from "react";

export default function BookingForm({ listingId, guestId }: { listingId: number; guestId: number }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("http://127.0.0.1:8000/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          guest_id: guestId,
          start_date: startDate,
          end_date: endDate,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessage("Booking failed: " + data.error);
      } else {
        setMessage("Booking confirmed!");
      }
    } catch (err) {
      setMessage("Error creating booking");
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "20px" }}>
      <h3>Book this listing</h3>
      <label>
        Start Date:
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      </label>
      <br />
      <label>
        End Date:
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
      </label>
      <br />
      <button type="submit">Book Now</button>
      {message && <p>{message}</p>}
    </form>
  );
}
