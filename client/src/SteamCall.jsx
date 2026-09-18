import { useEffect, useState } from "react";
import Card from "./Card.jsx";

function RecentlyPlayedGames() {
  const [games, setGames] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let canceled = false;

    async function loadRecentlyPlayed() {
      try {
        const res = await fetch("/api/games/recently-played");
        const text = await res.text();
        if (!text) {
          throw new Error(
            "Empty response from /api/games/recently-played (is the server running?)",
          );
        }

        const data = JSON.parse(text);
        if (!res.ok)
          throw new Error(
            data.error || "Failed to fetch recently played games",
          );
        if (!canceled) setGames(data.games ?? []);
      } catch (err) {
        if (!canceled) setError(err.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    loadRecentlyPlayed();
    return () => {
      canceled = true;
    };
  }, []);

  if (loading)
    return (
      <p className="media-section__header">Loading recently played games...</p>
    );
  if (error)
    return (
      <p className="media-section__header">
        Could not load recently played games: {error}
      </p>
    );
  if (games.length === 0)
    return (
      <p className="media-section__header">No recently played games found.</p>
    );

  return (
    <section className="card-row">
      {games.map((game) => (
        <Card
          variant="game"
          image={game.image_url}
          name={game.name}
          description={game.description}
        />
      ))}
    </section>
  );
}

export default RecentlyPlayedGames;
