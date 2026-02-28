// Maps user-facing dining hall ID -> Nutrislice API slug
const DINING_HALLS = {
  'gordon-avenue-market': 'gordon-avenue-market',    // Gordon Dining & Event Center
  'four-lakes-market':    'four-lakes-market',
  'rhetas-market':        'rhetas-market',
  'lizs-market':          'lizs-market',
  'carsons-market':       'carsons-market',
  'lowell-market':        'lowell-market',
};

// Hours schema:
//   Each day key (mon–sun) maps to an object of { mealType: "H:MM AM – H:MM PM" }
//   or null if the hall is closed that day.
//   Weekend halls that serve brunch use the "brunch" key instead of breakfast + lunch.
const DINING_HALL_INFO = [
  {
    id: 'gordon-avenue-market',
    name: 'Gordon Dining & Event Center',
    shortName: 'Gordon',
    mealTypes: ['breakfast', 'lunch', 'dinner', 'brunch'],
    hours: {
      mon: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:30 PM' },
      tue: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:30 PM' },
      wed: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:30 PM' },
      thu: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:30 PM' },
      fri: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:30 PM' },
      sat: { brunch: '9:00 AM–2:00 PM', dinner: '4:00–8:30 PM' },
      sun: { brunch: '9:00 AM–2:00 PM', dinner: '4:00–8:30 PM' },
    },
  },
  {
    id: 'four-lakes-market',
    name: 'Four Lakes Market',
    shortName: 'Four Lakes',
    mealTypes: ['breakfast', 'lunch', 'dinner', 'brunch'],
    hours: {
      mon: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      tue: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      wed: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      thu: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      fri: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      sat: { brunch: '9:00 AM–2:00 PM', dinner: '4:00–8:30 PM' },
      sun: { brunch: '9:00 AM–2:00 PM', dinner: '4:00–8:30 PM' },
    },
  },
  {
    id: 'rhetas-market',
    name: "Rheta's Market",
    shortName: "Rheta's",
    mealTypes: ['breakfast', 'lunch', 'dinner', 'brunch'],
    hours: {
      mon: { breakfast: '7:00–11:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      tue: { breakfast: '7:00–11:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      wed: { breakfast: '7:00–11:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      thu: { breakfast: '7:00–11:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      fri: { breakfast: '7:00–11:00 AM', lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      sat: null,
      sun: { brunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
    },
  },
  {
    id: 'lizs-market',
    name: "Liz's Market",
    shortName: "Liz's",
    mealTypes: ['breakfast', 'lunch', 'dinner', 'brunch'],
    hours: {
      mon: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      tue: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      wed: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      thu: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      fri: { breakfast: '7:00–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      sat: { brunch: '9:00 AM–2:00 PM', dinner: '4:00–8:30 PM' },
      sun: null,
    },
  },
  {
    id: 'carsons-market',
    name: "Carson's Market",
    shortName: "Carson's",
    mealTypes: ['lunch', 'dinner'],
    hours: {
      mon: { lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      tue: { lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      wed: { lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      thu: { lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
      fri: null,
      sat: null,
      sun: { lunch: '11:00 AM–4:00 PM', dinner: '4:00–8:00 PM' },
    },
  },
  {
    id: 'lowell-market',
    name: 'Lowell Market',
    shortName: 'Lowell',
    mealTypes: ['breakfast', 'lunch', 'dinner'],
    hours: {
      mon: { breakfast: '7:30–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      tue: { breakfast: '7:30–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      wed: { breakfast: '7:30–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      thu: { breakfast: '7:30–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      fri: { breakfast: '7:30–10:00 AM', lunch: '11:00 AM–2:00 PM', dinner: '4:00–8:00 PM' },
      sat: null,
      sun: null,
    },
  },
];

function getDiningHallInfo(id) {
  return DINING_HALL_INFO.find((h) => h.id === id) ?? null;
}

/**
 * Returns the current date string in CT ("YYYY-MM-DD").
 */
function getTodayCT() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

/**
 * Returns true if a dining hall is open for a given meal type on a given date.
 * @param {string}  id       - hall id
 * @param {string}  mealType - "breakfast" | "lunch" | "dinner" | "brunch"
 * @param {string} [date]    - "YYYY-MM-DD" in CT; defaults to today
 */
function isOpen(id, mealType, date) {
  const hall = getDiningHallInfo(id);
  if (!hall) return false;
  const resolved = date ?? getTodayCT();
  // Append T12:00 so the local day isn't shifted by UTC midnight parsing
  const d = new Date(`${resolved}T12:00:00`);
  const dayKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][d.getDay()];
  const dayHours = hall.hours[dayKey];
  if (!dayHours) return false;
  return mealType in dayHours;
}

module.exports = { DINING_HALLS, DINING_HALL_INFO, getDiningHallInfo, isOpen, getTodayCT };
