export default function FoodCard({ item }) {
  const { name, nutrition, food_tags, serving_size, is_build_your_own } = item;
  const n = nutrition;

  return (
    <div className={`food-card ${is_build_your_own ? 'build-your-own' : ''}`}>
      <div className="food-card-body">
        <div className="food-info">
          <h3 className="food-name">{name}</h3>
          {!is_build_your_own && (
            <div className="food-macros">
              <span className="macro cal">{n.calories} cal</span>
              <span className="macro protein">{n.g_protein}g P</span>
              <span className="macro carbs">{n.g_carbs}g C</span>
              <span className="macro fat">{n.g_fat}g F</span>
            </div>
          )}
          {is_build_your_own && (
            <span className="byo-label">Custom — log ingredients</span>
          )}
          {food_tags.length > 0 && (
            <div className="food-tags">
              {food_tags.map((tag) => (
                <span key={tag} className="tag">{tag.toLowerCase()}</span>
              ))}
            </div>
          )}
        </div>
        <button className="add-btn" aria-label={`Add ${name}`}>+</button>
      </div>
    </div>
  );
}
