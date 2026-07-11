"use client";
import { useEffect, useState } from "react";

export default function TripsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [listings, setListings] = useState<{ [key: number]: any }>({});

  useEffect(() => {
    // Fetch all bookings
    fetch("http://127.0.0.1:8000/bookings")
      .then((res) => res.json())
      .then((data) => {
        setBookings(data);

        // Fetch listing details for each booking
        data.forEach((booking: any) => {
          fetch(`http://127.0.0.1:8000/listings/${booking.listing_id}`)
            .then((res) => res.json())
            .then((listingData) => {
              setListings((prev) => ({
                ...prev,
                [booking.listing_id]: listingData,
              }));
            });
        });
      });
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Trips</h1>
      {bookings.map((booking) => {
        const listing = listings[booking.listing_id];
        return (
          <div
            key={booking.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
              marginBottom: "15px",
            }}
          >
            <h2>{listing ? listing.title : "Loading..."}</h2>
            <p>Location: {listing ? listing.location : ""}</p>
            <p>
              Dates: {booking.start_date} → {booking.end_date}
            </p>
            <p>Status: {booking.status}</p>
          </div>
        );
      })}
    </div>
  );
}
