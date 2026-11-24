# Movie Library (MongoDB CRUD)

A small web app for creating, viewing, editing, and deleting movie records in MongoDB. By default, it connects to a local MongoDB server, which you can inspect with MongoDB Compass.

## Database design

- Database: `movieDB`
- Collection: `movies`
- Each document has `title` (string), `year` (integer), `genre` (string), `director` (string), and `rating` (number from 0 to 10).
- MongoDB adds an `_id` ObjectId to each movie. The app creates an index on `title`.

## Configure local MongoDB

MongoDB Compass is a graphical client; it does not include the MongoDB database server. Install and start MongoDB Community Server on your computer, then connect Compass to `mongodb://127.0.0.1:27017`.

Copy `.env.example` to `.env`. The example URI, `mongodb://127.0.0.1:27017/movieDB`, connects the app to the local server. If your MongoDB server uses a different host or port, update `MONGODB_URI`. The app creates the `movieDB.movies` collection on the first insert if it does not already exist. Keep `.env` private; it is excluded from Git.

## Run locally

Requires Node.js 18 or newer.

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Set `PORT` in `.env` to use another port.

## CRUD API

| Method | Endpoint | Operation |
| --- | --- | --- |
| `GET` | `/api/movies` | List movies |
| `POST` | `/api/movies` | Add a movie |
| `PUT` | `/api/movies/:id` | Update a movie |
| `DELETE` | `/api/movies/:id` | Delete a movie |

Example request body:

```json
{
  "title": "The Grand Budapest Hotel",
  "year": 2014,
  "genre": "Comedy",
  "director": "Wes Anderson",
  "rating": 8.1
}
```

The browser UI provides the same CRUD operations. The server validates movie fields and returns an error response for invalid input or missing movie IDs.
