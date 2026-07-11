from fastapi import FastAPI, HTTPException, UploadFile, File
import sqlite3
import os
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import sqlite3, bcrypt

app = FastAPI(redirect_slashes=False)

class UserRegister(BaseModel):
    username: str
    password: str
    role: str   # "guest" or "host"

# ✅ Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Connect to your database
conn = sqlite3.connect("airbnb.db", check_same_thread=False)
cursor = conn.cursor()

# Pydantic model for user registration
class UserCreate(BaseModel):
    username: str
    password: str
    role: str   # must be "guest" or "host"

@app.post("/register")
def register(user: UserCreate):
    try:
        hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt()).decode("utf-8")
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
            (user.username, hashed_pw, user.role)
        )
        conn.commit()
        return {"status": "user registered"}
    except Exception as e:
        # ✅ Show the actual database error in Swagger
        raise HTTPException(status_code=500, detail=str(e))

class UserLogin(BaseModel):
    username: str
    password: str

@app.post("/login")
def login(user: UserLogin):
    cursor.execute("SELECT id, password, role FROM users WHERE username = ?", (user.username,))
    row = cursor.fetchone()

    if row is None:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    stored_id, stored_pw, stored_role = row

    # ✅ Check password (convert stored string back to bytes)
    if not bcrypt.checkpw(user.password.encode(), stored_pw.encode("utf-8")):
        raise HTTPException(status_code=400, detail="Invalid username or password")

    return {"status": "login successful", "user_id": stored_id, "role": stored_role}

class BookingCreate(BaseModel):
    listing_id: int
    guest_id: int   # comes from login



# ✅ Serve static files from uploads folder
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ---------------------------
# Request body models
# ---------------------------
class Booking(BaseModel):
    listing_id: int
    guest_id: int
    start_date: str
    end_date: str

class Review(BaseModel):
    listing_id: int
    guest_id: int
    rating: int
    comment: str = ""
class Listing(BaseModel):
    title: str
    description: str
    location: str
    price_per_night: int
    amenities: str
    photos: str = ""
    rating: int = 0
    host_id: int

# ---------------------------
# Listings endpoints
# ---------------------------
@app.get("/listings")
def get_listings(location: str = None, min_price: int = None, max_price: int = None, amenities: str = None):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    query = """SELECT id, title, description, location, price_per_night, amenities, photos, rating 
               FROM listings WHERE 1=1"""
    params = []
    if location:
        query += " AND location LIKE ?"
        params.append(f"%{location}%")
    if min_price:
        query += " AND price_per_night >= ?"
        params.append(min_price)
    if max_price:
        query += " AND price_per_night <= ?"
        params.append(max_price)
    if amenities:
        query += " AND amenities LIKE ?"
        params.append(f"%{amenities}%")

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "title": r[1],
            "description": r[2],
            "location": r[3],
            "price_per_night": r[4],
            "amenities": r[5],
            "photos": r[6],
            "rating": r[7],
        }
        for r in rows
    ]

@app.get("/listings/{listing_id}")
def get_listing(listing_id: int):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, description, location, price_per_night, amenities, photos, rating FROM listings WHERE id = ?",
        (listing_id,),
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return {
            "id": row[0],
            "title": row[1],
            "description": row[2],
            "location": row[3],
            "price_per_night": row[4],
            "amenities": row[5],
            "photos": row[6],
            "rating": row[7],
        }
    raise HTTPException(status_code=404, detail="Listing not found")

@app.post("/listings")
def create_listing(listing: Listing):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO listings (title, description, location, price_per_night, amenities, photos, rating, host_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        (
            listing.title,
            listing.description,
            listing.location,
            listing.price_per_night,
            listing.amenities,
            listing.photos,
            listing.rating,
            listing.host_id,
        ),
    )
    conn.commit()
    listing_id = cursor.lastrowid
    conn.close()
    return {"id": listing_id, **listing.dict()}


@app.put("/listings/{listing_id}")
def update_listing(listing_id: int, listing: Listing):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE listings SET title=?, description=?, location=?, price_per_night=?, amenities=?, photos=?, rating=?, host_id=? WHERE id=?",
        (
            listing.title,
            listing.description,
            listing.location,
            listing.price_per_night,
            listing.amenities,
            listing.photos,
            listing.rating,
            listing.host_id,
            listing_id,
        ),
    )
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Listing not found")
    conn.close()
    return {"id": listing_id, **listing.dict()}


@app.delete("/listings/{listing_id}")
def delete_listing(listing_id: int):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute("DELETE FROM listings WHERE id=?", (listing_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Listing not found")
    conn.close()
    return {"status": "deleted", "id": listing_id}

# ---------------------------
# Bookings endpoints
# ---------------------------
@app.post("/bookings")
def create_booking(booking: Booking):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM bookings WHERE listing_id = ? AND NOT (end_date < ? OR start_date > ?)",
        (booking.listing_id, booking.start_date, booking.end_date),
    )
    overlap = cursor.fetchone()[0]
    if overlap > 0:
        conn.close()
        return {"error": "Dates already booked"}

    cursor.execute(
        "INSERT INTO bookings (listing_id, guest_id, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)",
        (booking.listing_id, booking.guest_id, booking.start_date, booking.end_date, "confirmed"),
    )
    conn.commit()
    booking_id = cursor.lastrowid
    conn.close()
    return {"booking_id": booking_id, "status": "confirmed"}

@app.get("/bookings")
def get_bookings():
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, listing_id, guest_id, start_date, end_date, status FROM bookings")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row[0],
            "listing_id": row[1],
            "guest_id": row[2],
            "start_date": row[3],
            "end_date": row[4],
            "status": row[5],
        }
        for row in rows
    ]

# ---------------------------
# Reviews endpoints
# ---------------------------
@app.post("/reviews")
def create_review(review: Review):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO reviews (listing_id, guest_id, rating, comment) VALUES (?, ?, ?, ?)",
        (review.listing_id, review.guest_id, review.rating, review.comment),
    )
    conn.commit()
    review_id = cursor.lastrowid
    conn.close()
    return {"review_id": review_id, "status": "added"}

@app.get("/reviews")
def get_reviews():
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, listing_id, guest_id, rating, comment FROM reviews")
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row[0],
            "listing_id": row[1],
            "guest_id": row[2],
            "rating": row[3],
            "comment": row[4],
        }
        for row in rows
    ]

# ---------------------------
# Listing photos endpoints
# ---------------------------
UPLOAD_DIR = "uploads"

@app.get("/listing_photos/{listing_id}")
def get_listing_photos(listing_id: int):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute("SELECT photo_url FROM listing_photos WHERE listing_id = ?", (listing_id,))
    photos = [row[0] for row in cursor.fetchall()]
    conn.close()
    return {"listing_id": listing_id, "photos": photos}

@app.post("/listing_photos/{listing_id}")
def upload_listing_photo(listing_id: int, file: UploadFile = File(...)):
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())

    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO listing_photos (listing_id, photo_url) VALUES (?, ?)",
        (listing_id, file.filename),
    )
    conn.commit()
    conn.close()
    return {"status": "photo uploaded", "listing_id": listing_id, "photo_url": file.filename}

# ---------------------------
# Host bookings endpoint
@app.get("/host_bookings/{host_id}")
def get_host_bookings(host_id: int):
    conn = sqlite3.connect("airbnb.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT b.id, b.listing_id, b.guest_id, b.start_date, b.end_date, b.status
        FROM bookings b
        JOIN listings l ON b.listing_id = l.id
        WHERE l.host_id = ?
    """, (host_id,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": row[0],
            "listing_id": row[1],
            "guest_id": row[2],
            "start_date": row[3],
            "end_date": row[4],
            "status": row[5],
        }
        for row in rows
    ]
@app.get("/dashboard/{host_id}")
def dashboard(host_id: int):
    conn = sqlite3.connect("airbnb.db")   # ✅ open connection
    cursor = conn.cursor()
    cursor.execute("""
        SELECT l.id, l.title, l.location, l.price_per_night, l.amenities,
               b.id, b.guest_id, b.start_date, b.end_date, b.status
        FROM listings l
        LEFT JOIN bookings b ON l.id = b.listing_id
        WHERE l.host_id = ?
    """, (host_id,))
    rows = cursor.fetchall()
    conn.close()   # ✅ close connection

    # ✅ Group bookings under each listing
    dashboard = {}
    for row in rows:
        listing_id = row[0]
        if listing_id not in dashboard:
            dashboard[listing_id] = {
                "id": row[0],
                "title": row[1],
                "location": row[2],
                "price_per_night": row[3],
                "amenities": row[4],
                "bookings": []
            }
        if row[5]:  # booking exists
            dashboard[listing_id]["bookings"].append({
                "id": row[5],
                "guest_id": row[6],
                "start_date": row[7],
                "end_date": row[8],
                "status": row[9]
            })

    return {"dashboard": list(dashboard.values())}

