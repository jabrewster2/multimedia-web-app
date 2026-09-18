require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/movies/favorites", async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  try {
    const url = new URL(
      `https://api.themoviedb.org/3/account/${process.env.TMDB_ACCOUNT_ID}/favorite/movies`,
    );
    url.searchParams.append("session_id", process.env.TMDB_SESSION_ID);
    url.searchParams.append("language", "en-US");
    url.searchParams.append("page", String(page));
    url.searchParams.append("sort_by", "created_at.desc");

    const upstream = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
        Accept: "application/json",
      },
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: "favorites lookup failed", details: data });
    }

    const movies = (data.results ?? []).map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      rating: movie.vote_average,
      poster_url: movie.poster_path
        ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
        : null,
    }));

    res.json({ page: data.page, total_pages: data.total_pages, movies });
  } catch (error) {
    console.error(error);
    res
      .status(502)
      .json({ error: "favorites lookup failed", details: error.message });
  }
});

app.get("/api/games/recentlylayed", async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  try {
    const url = new URL(
      `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/`,
    );
    url.searchParams.append("key", process.env.STEAM_API_KEY);
    url.searchParams.append("steamid", process.env.STEAM_USER_ID);
    url.searchParams.append("format", "json");

    console.log("Steam API request URL:", url.toString());

    const upstream = await fetch(url);

    const data = await upstream.json();
    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: "recently played games lookup failed", details: data });
    }

    const games = (data.response?.games ?? []).map((game) => ({
      id: game.appid,
      name: game.name,
      image_url: game.img_icon_url
        ? `https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`
        : null,
      description: game.last_played
        ? `Last played: ${new Date(game.last_played * 1000).toLocaleDateString()}`
        : "Never played",
    }));

    res.json({ games });
  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "recently played games lookup failed",
      details: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
