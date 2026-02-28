export default function MealSelector({ meals, selected, onSelect }) {
  return (
    <div className="meal-selector">
      {meals.map((meal) => (
        <button
          key={meal}
          className={`meal-btn ${meal === selected ? 'active' : ''}`}
          onClick={() => onSelect(meal)}
        >
          {meal.charAt(0).toUpperCase() + meal.slice(1)}
        </button>
      ))}
    </div>
  );
}
