import { useState, useEffect } from 'react';
import HallTabs from './components/HallTabs';
import MealSelector from './components/MealSelector';
import MenuList from './components/MenuList';

export default function App() {
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);
  const [selectedMeal, setSelectedMeal] = useState('dinner');
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch dining halls on mount
  useEffect(() => {
    fetch('/api/dining-halls')
      .then((r) => r.json())
      .then((data) => {
        setHalls(data.dining_halls);
        if (data.dining_halls.length > 0) {
          setSelectedHall(data.dining_halls[0].id);
        }
      })
      .catch(() => setError('Failed to load dining halls'));
  }, []);

  // Fetch menu when hall or meal changes
  useEffect(() => {
    if (!selectedHall || !selectedMeal) return;
    setLoading(true);
    setError(null);
    fetch(`/api/menu?hall=${selectedHall}&meal=${selectedMeal}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setMenuItems([]);
        } else {
          setMenuItems(data.items);
        }
      })
      .catch(() => setError('Failed to load menu'))
      .finally(() => setLoading(false));
  }, [selectedHall, selectedMeal]);

  const currentHall = halls.find((h) => h.id === selectedHall);
  const mealTypes = currentHall?.mealTypes ?? ['breakfast', 'lunch', 'dinner'];

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">BadgerBite</h1>
      </header>

      <HallTabs
        halls={halls}
        selected={selectedHall}
        onSelect={setSelectedHall}
      />

      <MealSelector
        meals={mealTypes}
        selected={selectedMeal}
        onSelect={setSelectedMeal}
      />

      {loading && <p className="status-msg">Loading menu...</p>}
      {error && <p className="status-msg error">{error}</p>}
      {!loading && !error && menuItems.length === 0 && (
        <p className="status-msg">No items found for this meal.</p>
      )}
      {!loading && menuItems.length > 0 && <MenuList items={menuItems} />}
    </div>
  );
}
