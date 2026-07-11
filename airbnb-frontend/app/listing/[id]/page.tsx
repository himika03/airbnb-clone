"use client";
import { useEffect, useState } from "react";

export default function ListingDetail({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<any>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const guestId =
    typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/listings/${params.id}`)
      .then((res) => res.json())
      .then((data) => setListing(data));

    fetch(`http://127.0.0.1:8000/listing_photos/${params.id}`)
      .then((res) => res.json())
      .then((data) => setPhotos(data.photos));

    fetch("http://127.0.0.1:8000/reviews")
      .then((res) => res.json())
      .then((data) =>
        setReviews(data.filter((r: any) => r.listing_id == params.id))
      );
  }, [params.id]);

  if (!listing) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>{listing.title}</h1>
      <p>{listing.description}</p>
      <p>Location: {listing.location}</p>
      <p>₹{listing.price_per_night} per night</p>
      <p>Amenities: {listing.amenities}</p>

      {/* ✅ Photo gallery */}
      <h2>Photos</h2>
      {photos.length === 0 ? (
        <p>No photos yet.</p>
      ) : (
        <div style={{ display: "flex", gap: "10px" }}>
          {photos.map((p, i) => (
            <img
              key={i}
              src={`http://127.0.0.1:8000/uploads/${p}`}
              alt="Listing photo"
              width="200"
            />
          ))}
        </div>
      )}

      {/* ✅ Reviews */}
      <h2>Reviews</h2>
      {reviews.length === 0 ? (
        <p>No reviews yet.</p>
      ) : (
        reviews.map((r) => (
          <div
            key={r.id}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginBottom: "10px",
            }}
          >
            <p>⭐ {r.rating}</p>
            <p>{r.comment}</p>
            <p>Guest ID: {r.guest_id}</p>
          </div>
        ))
      )}

      {/* ✅ Booking form */}
      <h2>Book this listing</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const start = (e.target as any).start.value;
          const end = (e.target as any).end.value;
          fetch("http://127.0.0.1:8000/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listing_id: listing.id,
              guest_id: guestId, // ✅ use logged-in guest ID
              start_date: start,
              end_date: end,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              alert("Booking confirmed!");
              // optional: refresh listing or dashboard
            });
        }}
      >
        <label>
          Start Date: <input type="date" name="start" required />
        </label>
        <br />
        <label>
          End Date: <input type="date" name="end" required />
        </label>
        <br />
        <button type="submit">Book Now</button>
      </form>

      {/* ✅ Review submission */}
      <h2>Leave a Review</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const rating = (e.target as any).rating.value;
          const comment = (e.target as any).comment.value;
          fetch("http://127.0.0.1:8000/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listing_id: listing.id,
              guest_id: guestId, // ✅ use logged-in guest ID
              rating: parseInt(rating),
              comment,
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              alert("Review added!");
              // refresh reviews
              fetch("http://127.0.0.1:8000/reviews")
                .then((res) => res.json())
                .then((data) =>
                  setReviews(data.filter((r: any) => r.listing_id == params.id))
                );
            });
        }}
      >
        <label>
          Rating (1-5):{" "}
          <input type="number" name="rating" min="1" max="5" required />
        </label>
        <br />
        <label>
          Comment: <textarea name="comment"></textarea>
        </label>
        <br />
        <button type="submit">Submit Review</button>
      </form>
    </div>
  );
}
