require("dotenv").config();

const express = require("express");
const request = require("request");
const crypto = require("crypto");
const cors = require("cors");
const querystring = require("querystring");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3001;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

async function getRawgData(name) {
  try {
    const searchUrl = new URL("https://api.rawg.io/api/games");
    searchUrl.searchParams.append("key", process.env.RAWG_API_KEY);
    searchUrl.searchParams.append("search", name);
    searchUrl.searchParams.append("page_size", "1");
    searchUrl.searchParams.append("search_exact", "true");

    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return { image: null, description: null };

    const searchData = await searchResponse.json();
    const matchingGame = searchData.results?.[0];
    if (!matchingGame) return { image: null, description: null };

    const detailsUrl = new URL(
      `https://api.rawg.io/api/games/${matchingGame.id}`,
    );
    detailsUrl.searchParams.append("key", process.env.RAWG_API_KEY);

    const detailsResponse = await fetch(detailsUrl);
    const gameDetails = detailsResponse.ok
      ? await detailsResponse.json()
      : null;

    return {
      image: matchingGame.background_image || null,
      description: gameDetails?.description_raw || null,
    };
  } catch (error) {
    console.error("Error fetching data from RAWG API:", error);
    return { image: null, description: null };
  }
}

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

app.get("/api/games/recently-played", async (req, res) => {
  try {
    const steam_url = new URL(
      `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v0001/`,
    );
    steam_url.searchParams.append("key", process.env.STEAM_API_KEY);
    steam_url.searchParams.append("steamid", process.env.STEAM_USER_ID);
    steam_url.searchParams.append("format", "json");

    const upstream = await fetch(steam_url);

    const steam_data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "recently played games lookup failed",
        details: steam_data,
      });
    }

    const games = await Promise.all(
      (steam_data.response?.games ?? []).map(async (game) => {
        const rawg = await getRawgData(game.name);

        return {
          id: game.appid,
          name: game.name,
          // RAWG image, falling back to Steam's larger header image
          image_url:
            rawg.image ??
            `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`,
          // RAWG description, falling back to your playtime text
          description: game.playtime_forever
            ? `Played for ${Math.round(game.playtime_forever / 60)} hours`
            : "No playtime data",
          playtime_hours: Math.round((game.playtime_forever ?? 0) / 60),
        };
      }),
    );

    res.json({ games });
  } catch (error) {
    console.error(error);
    res.status(502).json({
      error: "recently played games lookup failed",
      details: error.message,
    });
  }
});

app.get("/api/music/top-tracks", async (req, res) => {
  try {
    const access_token = await getAccessToken();

    const topTracks_url = new URL("https://api.spotify.com/v1/me/top/tracks");
    topTracks_url.searchParams.append("time_range", "short_term");
    topTracks_url.searchParams.append("limit", "10");
    topTracks_url.searchParams.append("offset", "0");

    const upstream = await fetch(topTracks_url.toString(), {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const topTrack_data = await upstream.json();
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: "Top tracks lookup failed",
        details: topTrack_data,
      });
    }

    const topTracks = (topTrack_data.items ?? []).map((track) => ({
      album: track.album.name,
      artists: track.artists.map((a) => a.name).join(", "),
      name: track.name,
      image_url: track.album.images[0]?.url,
    }));

    res.json({ topTracks });
  } catch (error) {
    console.error(error);
    if (error.message.includes("Not logged in")) {
      return res.status(401).json({ error: "not_logged_in" });
    }
    res.status(502).json({
      error: "Top Tracks lookup failed",
      details: error.message,
    });
  }
});

var client_id = process.env.SPOTIFY_CLIENT_ID;
var client_secret = process.env.SPOTIFY_CLIENT_SECRET;
var redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

const generateRandomString = (length) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

var stateKey = "spotify_auth_state";

app
  .use(express.static(__dirname + "/server"))
  .use(cors())
  .use(cookieParser());

app.get("/login", function (req, res) {
  var state = generateRandomString(16);
  var scope = "user-top-read";

  res.cookie(stateKey, state);

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
      }),
  );
});

let tokens = { access_token: null, refresh_token: null, expires_at: 0 };

app.get("/callback", async (req, res) => {
  console.log("callback hit", req.query);
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (!state || state !== storedState) {
    return res.redirect(
      "/#" + querystring.stringify({ error: "state_mismatch" }),
    );
  }
  res.clearCookie(stateKey);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(client_id + ":" + client_secret).toString("base64"),
      },
      body: new URLSearchParams({
        code,
        redirect_uri,
        grant_type: "authorization_code",
      }),
    });
    const body = await response.json();
    console.log(response.status, body);

    if (!response.ok) {
      return res.redirect(
        "/#" + querystring.stringify({ error: "invalid_token" }),
      );
    }

    tokens = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: Date.now() + body.expires_in * 1000,
    };
    res.redirect("/"); // or wherever your front end lives
  } catch (err) {
    console.error(err);
    res.redirect("/#" + querystring.stringify({ error: "invalid_token" }));
  }
});

app.get("/refresh_token", function (req, res) {
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        new Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token,
        refresh_token = body.refresh_token;
      res.send({
        access_token: access_token,
        refresh_token: refresh_token,
      });
    }
  });
});

async function getAccessToken() {
  if (!tokens.access_token)
    throw new Error("Not logged in. Visit /login first.");

  if (Date.now() < tokens.expires_at - 60_000) return tokens.access_token;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error("Token refresh failed");

  tokens.access_token = body.access_token;
  tokens.expires_at = Date.now() + body.expires_in * 1000;
  if (body.refresh_token) tokens.refresh_token = body.refresh_token;
  return tokens.access_token;
}

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Server is running on port ${PORT}`);
});
