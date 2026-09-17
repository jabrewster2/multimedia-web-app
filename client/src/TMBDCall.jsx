import { useEffect, useState } from "react";
import Card from "./Card.jsx";

function FavoriteMovies() {
  const [movies, setMovies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    async function loadFavorites() {
      try {
        const res = await fetch("/api/movies/favorites");
        const text = await res.text();
        if (!text) {
          throw new Error(
            "Empty response from /api/movies/favorites (is the server running?)",
          );
        }

        const data = JSON.parse(text);
        if (!res.ok)
          throw new Error(data.error || "Failed to fetch favorite movies");
        if (!canceled) setMovies(data.movies ?? []);
      } catch (err) {
        if (!canceled) setError(err.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    loadFavorites();
    return () => {
      canceled = true;
    };
  }, []);

  if (loading)
    return <p className="media-section__header">Loading favorite movies...</p>;
  if (error)
    return (
      <p className="media-section__header">
        Could not load favorite movies: {error}
      </p>
    );
  if (movies.length === 0)
    return <p className="media-section__header">No favorite movies found.</p>;

  return (
    <section className="card-row">
      {movies.map((movie) => (
        <Card
          variant="movie"
          image={movie.poster_url}
          name={movie.title}
          description={movie.overview}
        />
      ))}
    </section>
  );
}

export default FavoriteMovies;
