export default function HallTabs({ halls, selected, onSelect }) {
  return (
    <div className="hall-tabs">
      {halls.map((hall) => (
        <button
          key={hall.id}
          className={`hall-tab ${hall.id === selected ? 'active' : ''}`}
          onClick={() => onSelect(hall.id)}
        >
          {hall.shortName}
        </button>
      ))}
    </div>
  );
}
