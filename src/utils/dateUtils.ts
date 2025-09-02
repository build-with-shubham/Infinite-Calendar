import dayjs, { Dayjs } from "dayjs";

export function getMonthDays(year: number, month: number): Dayjs[] {
  const start = dayjs(new Date(year, month, 1)).startOf("week");
  const end = dayjs(new Date(year, month + 1, 0)).endOf("week");

  const days: Dayjs[] = [];
  let current = start;
  while (current.isBefore(end) || current.isSame(end, "day")) {
    days.push(current);
    current = current.add(1, "day");
  }
  return days;
}

export function formatDate(date: Date | Dayjs): string {
  return dayjs(date).format("YYYY-MM-DD");
}
