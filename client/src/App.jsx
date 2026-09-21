import FavoriteMovies from "./TMBDCall.jsx";
import RecentlyPlayedGames from "./SteamCall.jsx";
import RecentTracks from "./SpotifyCall.jsx";

function App() {
  return (
    <>
      <section className="media-section">
        {/*This is the game poster row*/}
        <div className="media-section__header">
          <h2>Your Most Recently Played Games:</h2>
        </div>
        <RecentlyPlayedGames />
        {/*This is the movie poster row*/}
        <div className="media-section__header">
          <h2>Your Top Movies:</h2>
        </div>
        <FavoriteMovies />
        {/*This is the music poster row*/}
        <div className="media-section__header">
          <h2>Your Top Tracks:</h2>
        </div>
        <RecentTracks />
      </section>
    </>
  );
}

export default App;
