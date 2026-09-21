function TrackMarquee({ tracks }) {
  const looped = [...tracks, ...tracks]; // duplicate for seamless loop

  return (
    <div className="marquee">
      <div className="marquee-track">
        {looped.map((track, i) => (
          <Card
            variant="song"
            image={track.image_url}
            name={track.name}
            description={track.description}
          />
        ))}
      </div>
    </div>
  );
}

export default TrackMarquee;
