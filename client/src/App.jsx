import Card from "./Card.jsx";

function App() {
  return (
    <>
      <section className="media-section">
        {/*This is the game poster row*/}
        <div className="media-section__header">
          <h2>Your Top Games:</h2>
        </div>
        <section className="card-row">
          <Card
            variant="game"
            image="/Games/ArkhamCityComicCover1.webp"
            name="Batman Arkham City"
            description="An action-adventure video game developed by Rocksteady Studios."
          />
          <Card
            variant="game"
            image="/Games/SlayTheSpire2.jpg"
            name="Slay the Spire 2"
            description="A roguelike deck-building video game developed by Mega Crit."
          />
          <Card
            variant="game"
            image="/Games/encloseHorse.png"
            name="Enclose Horse"
            description="A fucking stupid puzzle game where you enclose horses."
          />
        </section>
        {/*This is the movie poster row*/}
        <div className="media-section__header">
          <h2>Your Top Movies:</h2>
        </div>
        <section className="card-row">
          <Card
            variant="movie"
            image="/Movies/perfectBluePoster.jpg"
            name="Perfect Blue"
            description="A psychological thriller film directed by Satoshi Kon."
          />
          <Card
            variant="movie"
            image="/Movies/Pulp_Fiction_(1994)_poster.jpg"
            name="Pulp Fiction"
            description="A crime drama film directed by Quentin Tarantino."
          />
          <Card
            variant="movie"
            image="/Movies/theBatmanPoster.jpg"
            name="The Batman"
            description="A superhero film directed by Matt Reeves."
          />
          <Card
            variant="movie"
            image="/Movies/TheLighthousePoster.jpg"
            name="The Lighthouse"
            description="A psychological horror film directed by Robert Eggers."
          />
        </section>
        {/*This is the music poster row*/}
        <div className="media-section__header">
          <h2>Your Top Albums:</h2>
        </div>
        <section className="card-row">
          <Card
            variant="song"
            image="/Music/ABBA-dancing-queen-50th-anniversary.jpg"
            name="Dancing Queen"
            description="A disco song by ABBA."
          />
          <Card
            variant="song"
            image="/Music/LoserTameImpalaReal.webp"
            name="Loser"
            description="A song by Tame Impala."
          />
          <Card
            variant="song"
            image="/Music/theWall.jpg"
            name="The Wall"
            description="A progressive rock album by Pink Floyd.  "
          />
        </section>
      </section>
    </>
  );
}

export default App;
