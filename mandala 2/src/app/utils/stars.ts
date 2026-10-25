// utils/stars.ts
// Stars earned today. Kept in this browser only (localStorage), and reset each new day.
// Ten different poses finished in one visit earns a star; three stars in a day makes it a golden day.

export const POSES_PER_STAR = 10;
export const GOLD_DAY_STARS = 3;
export const STARS_EVENT = 'mandala-stars';

const KEY = 'mandala-stars';
// used when storage is blocked (private windows, some embedded browsers)
let memory = { date: '', stars: 0 };

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function readStars(): number {
  let saved = memory;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) saved = JSON.parse(raw);
  } catch {}
  return saved?.date === today() ? saved.stars : 0;
}

/** Adds a star for today and returns the new count. */
export function addStar(): number {
  const stars = readStars() + 1;
  memory = { date: today(), stars };
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {}
  window.dispatchEvent(new Event(STARS_EVENT));
  return stars;
}

export const isGoldDay = (stars: number) => stars >= GOLD_DAY_STARS;
