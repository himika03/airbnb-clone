"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [listings, setListings] = useState<any[]>([]);
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [amenities, setAmenities] = useState("");

  const fetchListings = () => {
    let url = "http://127.0.0.1:8000/listings?";
    if (location) url += `location=${location}&`;
    if (minPrice) url += `min_price=${minPrice}&`;
    if (maxPrice) url += `max_price=${maxPrice}&`;
    if (amenities) url += `amenities=${amenities}&`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => setListings(data));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Browse Listings</h1>

      {/* ✅ Search + Filters */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
        <input
          type="text"
          placeholder="Amenities (comma separated)"
          value={amenities}
          onChange={(e) => setAmenities(e.target.value)}
        />
        <button onClick={fetchListings}>Search</button>
      </div>

      {/* ✅ Listings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
        {listings.map((listing) => (
          <div key={listing.id} style={{ border: "1px solid #ccc", borderRadius: "8px", padding: "15px" }}>
            <h2>{listing.title}</h2>
            <p>{listing.location}</p>
            <p>₹{listing.price_per_night} per night</p>
            <p>Amenities: {listing.amenities}</p>
            <a href={`/listing/${listing.id}`}>View Details</a>
          </div>
        ))}
      </div>
    </div>
  );
}
