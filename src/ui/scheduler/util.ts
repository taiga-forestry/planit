import { invariant } from "@tanstack/react-router";

export const DEFAULT_MIN_TIME_INCREMENT = 30;
export const DEFAULT_HOURS_DURATION = 1;
export const DEFAULT_MINUTES_DURATION = 0;

// FIXME: sanitize all inputs here prob
export const extractDateTime = (datetime: string) => {
  const [date, time] = datetime.split(" ");
  return { date, time };
};

export const extractHoursMinutes = (time: string) => {
  const [hours, minutes] = time.split(":").map((v) => {
    const result = parseInt(v);
    invariant(!isNaN(result), `Invalid number: "${result}"`);
    return result;
  });
  return { hours, minutes };
};

export const incrementDateTime = (datetime: string, dh: number, dm: number) => {
  const { date, time } = extractDateTime(datetime);
  const { hours, minutes } = extractHoursMinutes(time);
  const [year, month, day] = date.split("-").map(Number);

  const dateObject = new Date(year, month - 1, day, hours, minutes);
  dateObject.setHours(dateObject.getHours() + dh);
  dateObject.setMinutes(dateObject.getMinutes() + dm);

  const newDate = [
    dateObject.getFullYear(),
    (dateObject.getMonth() + 1).toString().padStart(2, "0"),
    dateObject.getDate().toString().padStart(2, "0"),
  ].join("-");
  const newTime = dateObject.toTimeString().split(" ")[0].slice(0, 5);

  return `${newDate} ${newTime}`;
};

export const roundMinutes = (datetime: string, increment: 15 | 30) => {
  const { date, time } = extractDateTime(datetime);
  const { hours: h, minutes: m } = extractHoursMinutes(time);
  const roundedMinute = increment * Math.floor(m / increment) || "00";

  return `${date} ${h.toString().padStart(2, "0")}:${roundedMinute}`;
};

export const findDuration = (start: string, end: string) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  // calculate duration in minutes from milliseconds
  const totalMinutes = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60),
  );
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};
