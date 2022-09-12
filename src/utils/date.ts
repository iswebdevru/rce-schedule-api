// TODO: Consider all months. For example: February contains only 28 days.
export function isValidDate(date: number | null): date is number {
  return typeof date === 'number' && date > 0 && date < 32;
}

export function createDay(date: number | null) {
  return new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    isValidDate(date) ? date : new Date().getDate()
  );
}

export function normalizeDate(date: number) {
  return date < 10 ? `0${date}` : date.toString();
}
