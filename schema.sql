CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK(role IN ('host','guest')) NOT NULL
);

CREATE TABLE listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    price_per_night REAL NOT NULL,
    amenities TEXT,
    photos TEXT,
    rating REAL,
    FOREIGN KEY (host_id) REFERENCES users(id)
);

CREATE TABLE bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('confirmed','cancelled')) NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (guest_id) REFERENCES users(id)
);
CREATE TABLE reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    rating INTEGER CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (guest_id) REFERENCES users(id)
);
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT CHECK(role IN ('guest','host'))
);

