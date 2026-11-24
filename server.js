require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("MONGODB_URI is required. Add your MongoDB connection string to .env.");
}

app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = new MongoClient(mongoUri);
let movies;

function parseMovie(input) {
  const { title, year, genre, director, rating } = input || {};
  const parsedYear = Number(year);
  const parsedRating = Number(rating);
  const currentYear = new Date().getFullYear();

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 120 ||
    typeof genre !== "string" ||
    !genre.trim() ||
    genre.trim().length > 60 ||
    typeof director !== "string" ||
    !director.trim() ||
    director.trim().length > 120 ||
    (typeof year !== "string" && typeof year !== "number") ||
    (typeof year === "string" && !year.trim()) ||
    !Number.isInteger(parsedYear) ||
    parsedYear < 1888 ||
    parsedYear > currentYear + 5 ||
    (typeof rating !== "string" && typeof rating !== "number") ||
    (typeof rating === "string" && !rating.trim()) ||
    !Number.isFinite(parsedRating) ||
    parsedRating < 0 ||
    parsedRating > 10
  ) {
    return null;
  }

  return {
    title: title.trim(),
    year: parsedYear,
    genre: genre.trim(),
    director: director.trim(),
    rating: parsedRating
  };
}

function parseId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

app.get("/api/movies", async (req, res, next) => {
  try {
    const records = await movies.find({}).sort({ title: 1 }).toArray();
    res.json(records);
  } catch (error) {
    next(error);
  }
});

app.post("/api/movies", async (req, res, next) => {
  const movie = parseMovie(req.body);
  if (!movie) {
    return res.status(400).json({
      error: "Enter a title, genre, director, valid year, and rating from 0 to 10."
    });
  }

  try {
    const result = await movies.insertOne(movie);
    res.status(201).json({ _id: result.insertedId, ...movie });
  } catch (error) {
    next(error);
  }
});

app.put("/api/movies/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid movie ID." });
  }

  const movie = parseMovie(req.body);
  if (!movie) {
    return res.status(400).json({
      error: "Enter a title, genre, director, valid year, and rating from 0 to 10."
    });
  }

  try {
    const result = await movies.updateOne({ _id: id }, { $set: movie });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.json({ _id: id, ...movie });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/movies/:id", async (req, res, next) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(400).json({ error: "Invalid movie ID." });
  }

  try {
    const result = await movies.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Movie not found." });
    }
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) {
    return next(error);
  }
  res.status(500).json({ error: "The request could not be completed." });
});

async function start() {
  await client.connect();
  const database = client.db("movieDB");
  movies = database.collection("movies");
  await movies.createIndex({ title: 1 });

  app.listen(port, () => {
    console.log(`Movie database app running at http://localhost:${port}`);
  });
}

start().catch(async (error) => {
  console.error("Could not connect to MongoDB:", error.message);
  await client.close();
  process.exitCode = 1;
});

async function close() {
  await client.close();
}

process.on("SIGINT", close);
process.on("SIGTERM", close);
