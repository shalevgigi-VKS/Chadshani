import { Timestamp } from 'firebase/firestore';
import { addMonths, setDate, startOfDay } from 'date-fns';

export function calcNextDueDate(dayOfMonth: number): Timestamp {
  const today = startOfDay(new Date());
  let candidate = setDate(today, dayOfMonth);
  if (candidate <= today) candidate = setDate(addMonths(today, 1), dayOfMonth);
  return Timestamp.fromDate(candidate);
}

export function recurringLabel(day: number): string {
  return `כל ${day} לחודש`;
}
