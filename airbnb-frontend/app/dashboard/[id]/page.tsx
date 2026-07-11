"use client";
import { useEffect, useState } from "react";

export default function Dashboard({ params }: { params: Promise<{ id: string }> }) {
  const [dashboard, setDashboard] = useState<any[]>([]);
  const [id, setId] = useState<string | null>(null);

  // ✅ unwrap params once
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // ✅ fetch only when id is ready
  useEffect(() => {
    if (!id) return;
    fetch(`http://127.0.0.1:8000/dashboard/${id}`)
      .then((res) => res.json())
      .then((data) => setDashboard(data.dashboard));
  }, [id]);

  if (!dashboard) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Host Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
        {dashboard.map((listing) => (
          <div key={listing.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px" }}>
            <h2>{listing.title}</h2>
            <p>{listing.location}</p>
            <p>₹{listing.price_per_night} per night</p>
            <p>Amenities: {listing.amenities}</p>
            {/* photos + bookings code stays here */}
          </div>
        ))}
      </div>
    </div>
  );
}
