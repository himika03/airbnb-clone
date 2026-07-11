"use client";
import { useEffect, useState } from "react";

export default function HostDashboard() {
  const [listings, setListings] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [amenities, setAmenities] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    const hostId = localStorage.getItem("user_id");
    if (!hostId) return;

    // ✅ Fetch dashboard data (listings + bookings)
    fetch(`http://127.0.0.1:8000/dashboard/${hostId}`)
      .then((res) => res.json())
      .then((data) => setListings(data.dashboard));
  }, []);

  const createListing = () => {
    const hostId = localStorage.getItem("user_id");
    if (!hostId) {
      alert("You must be logged in as a host!");
      return;
    }

    // Step 1: Create listing
    fetch("http://127.0.0.1:8000/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        location,
        price_per_night: price,
        amenities,
        photos: "",
        rating: 0,
        host_id: hostId, // ✅ ensure host_id is saved
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        alert("Listing created!");

        // Step 2: Upload photo if selected
        if (photoFile) {
          const formData = new FormData();
          formData.append("file", photoFile);

          fetch(`http://127.0.0.1:8000/listing_photos/${data.id}`, {
            method: "POST",
            body: formData,
          })
            .then((res) => res.json())
            .then(() => alert("Photo uploaded!"));
        }

        setListings((prev) => [...prev, data]);
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Host Dashboard</h1>

      {/* ✅ Create Listing Form */}
      <h2>Create New Listing</h2>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input placeholder="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <input
        type="number"
        placeholder="Price per night"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
      />
      <input placeholder="Amenities" value={amenities} onChange={(e) => setAmenities(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input type="file" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
      <button onClick={createListing}>Create Listing</button>

      {/* ✅ Manage Listings */}
      <h2>My Listings</h2>
      {listings.map((listing) => (
        <div key={listing.id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
          <h3>{listing.title}</h3>
          <p>{listing.location}</p>
          <p>₹{listing.price_per_night} per night</p>
          <p>Amenities: {listing.amenities}</p>

          {/* ✅ Edit button */}
          <button
            onClick={() => {
              const newTitle = prompt("Enter new title:", listing.title);
              if (newTitle) {
                fetch(`http://127.0.0.1:8000/listings/${listing.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...listing, title: newTitle }),
                })
                  .then((res) => res.json())
                  .then((updated) => {
                    alert("Listing updated!");
                    setListings((prev) =>
                      prev.map((l) => (l.id === listing.id ? updated : l))
                    );
                  });
              }
            }}
          >
            Edit
          </button>

          {/* ✅ Delete button */}
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete this listing?")) {
                fetch(`http://127.0.0.1:8000/listings/${listing.id}`, {
                  method: "DELETE",
                })
                  .then((res) => res.json())
                  .then(() => {
                    alert("Listing deleted!");
                    setListings((prev) => prev.filter((l) => l.id !== listing.id));
                  });
              }
            }}
          >
            Delete
          </button>

          {/* ✅ Show bookings under each listing */}
          <div style={{ marginTop: "10px" }}>
            <h4>Bookings:</h4>
            {listing.bookings && listing.bookings.length > 0 ? (
              listing.bookings.map((b: any) => (
                <p key={b.id}>
                  Guest {b.guest_id} | {b.start_date} → {b.end_date} | {b.status}
                </p>
              ))
            ) : (
              <p>No bookings yet.</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
