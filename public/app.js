const form = document.querySelector("#movie-form");
const movieList = document.querySelector("#movie-list");
const movieCount = document.querySelector("#movie-count");
const formHeading = document.querySelector("#form-heading");
const submitButton = document.querySelector("#submit-button");
const cancelButton = document.querySelector("#cancel-button");
const formMessage = document.querySelector("#form-message");
const listMessage = document.querySelector("#list-message");
const emptyState = document.querySelector("#empty-state");
const refreshButton = document.querySelector("#refresh-button");

let editingId = null;

function showMessage(element, message, isError) {
  element.textContent = message;
  element.classList.toggle("error", Boolean(isError));
}

function makeCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function makeActionButton(label, className, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", handler);
  return button;
}

function renderMovies(movies) {
  movieList.replaceChildren();
  movieCount.textContent = String(movies.length);
  emptyState.hidden = movies.length > 0;

  for (const movie of movies) {
    const row = document.createElement("tr");
    row.append(
      makeCell(movie.title),
      makeCell(String(movie.year)),
      makeCell(movie.genre),
      makeCell(movie.director),
      makeCell(Number(movie.rating).toFixed(1))
    );

    const actions = document.createElement("td");
    actions.className = "actions";
    actions.append(
      makeActionButton("Edit", "text-button", () => beginEdit(movie)),
      makeActionButton("Delete", "text-button delete-button", () => deleteMovie(movie))
    );
    row.append(actions);
    movieList.append(row);
  }
}

async function loadMovies() {
  showMessage(listMessage, "Loading movies…", false);
  try {
    const response = await fetch("/api/movies");
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Could not load movies.");
    }
    renderMovies(data);
    showMessage(listMessage, "", false);
  } catch (error) {
    showMessage(listMessage, error.message, true);
  }
}

function beginEdit(movie) {
  editingId = movie._id;
  for (const field of ["title", "year", "genre", "director", "rating"]) {
    form.elements[field].value = movie[field];
  }
  formHeading.textContent = "Edit movie";
  submitButton.textContent = "Save changes";
  cancelButton.hidden = false;
  showMessage(formMessage, "Update the details and save your changes.", false);
  form.elements.title.focus();
}

function resetForm() {
  editingId = null;
  form.reset();
  formHeading.textContent = "Add a movie";
  submitButton.textContent = "Add movie";
  cancelButton.hidden = true;
  showMessage(formMessage, "", false);
}

async function deleteMovie(movie) {
  if (!window.confirm(`Delete "${movie.title}" from your collection?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/movies/${encodeURIComponent(movie._id)}`, {
      method: "DELETE"
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Could not delete the movie.");
    }
    if (editingId === movie._id) {
      resetForm();
    }
    await loadMovies();
  } catch (error) {
    showMessage(listMessage, error.message, true);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const isEditing = Boolean(editingId);
  const movie = Object.fromEntries(new FormData(form).entries());
  const url = editingId ? `/api/movies/${encodeURIComponent(editingId)}` : "/api/movies";

  try {
    const response = await fetch(url, {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movie)
    });
    const data = response.status === 204 ? null : await response.json();
    if (!response.ok) {
      throw new Error((data && data.error) || "Could not save the movie.");
    }
    resetForm();
    showMessage(formMessage, isEditing ? "Movie updated." : "Movie added.", false);
    await loadMovies();
  } catch (error) {
    showMessage(formMessage, error.message, true);
  }
});

cancelButton.addEventListener("click", resetForm);
refreshButton.addEventListener("click", loadMovies);
loadMovies();
