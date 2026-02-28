import FoodCard from './FoodCard';

export default function MenuList({ items }) {
  // Group items by station
  const grouped = {};
  for (const item of items) {
    const station = item.station ?? 'Other';
    if (!grouped[station]) grouped[station] = [];
    grouped[station].push(item);
  }

  return (
    <div className="menu-list">
      {Object.entries(grouped).map(([station, foods]) => (
        <section key={station} className="station-section">
          <h2 className="station-name">{station.toUpperCase()}</h2>
          {foods.map((item) => (
            <FoodCard key={item.food_id} item={item} />
          ))}
        </section>
      ))}
    </div>
  );
}
