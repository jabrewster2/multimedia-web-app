import { useEffect, useState } from "react";
import TrackMarquee from "./Marquee.jsx";
import Card from "./Card.jsx";

function SpotifyCall() {
  const [topTracks, setTopTracks] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);

  useEffect(() => {
    let canceled = false;

    async function loadTopTracks() {
      try {
        const res = await fetch("/api/music/top-tracks");

        if (res.status === 401) {
          if (!canceled) setNeedsLogin(true);
          return;
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Request failed");

        if (!canceled) setTopTracks(data.topTracks ?? []);
      } catch (err) {
        if (!canceled) setError(err.message);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    loadTopTracks();
    return () => {
      canceled = true;
    };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  if (needsLogin) {
    return (
      <button onClick={() => (window.location.href = "/login")}>
        Log in with Spotify
      </button>
    );
  }

  return (
    <section className="marquee">
      <div className="marquee-track">
        {[...topTracks, ...topTracks].map((track, i) => (
          <div className="marquee-item" key={`${track.id}-${i}`}>
            <Card
              variant="song"
              image={track.image_url}
              name={track.name}
              description={track.description}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default SpotifyCall;
