function Card({ image, name, description, variant = "game", children }) {
  return (
    <article className={`card card--${variant}`}>
      <div className="card__image-wrap">
        <img className="card__image" src={image} alt={name} />
      </div>
      <div className="card__body">
        <h2 className="card__name">{name}</h2>
        {description && <p className="card__description">{description}</p>}
        {children}
      </div>
    </article>
  );
}

export default Card;
