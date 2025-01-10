import { Dispatch, SetStateAction } from "react";
import { Event } from "./types";
import {
  DEFAULT_MIN_TIME_INCREMENT,
  incrementDateTime,
  extractDateTime,
  extractHoursMinutes,
  roundMinutes,
  findDuration,
} from "./util";
import { MapBoxPlace } from "../map/types";
import { invariant } from "@tanstack/react-router";

interface Props {
  favoritePlaces: MapBoxPlace[];
  event: Event;
  setEvent: Dispatch<SetStateAction<Event | null>>;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

// FIXME: allow closing with escape key
export function EventPopup({
  favoritePlaces,
  event,
  setEvent,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { date: startDate, time: startTime } = extractDateTime(event.start);
  const duration = findDuration(event.start, event.end);
  const currentPlace = favoritePlaces.find(
    (place) => place.placeID === event.placeID,
  );

  return (
    <div className="w-[250px] text-16 bg-white border border-black p-36 rounded relative">
      <button className="text-20 p-12 absolute top-0 right-0" onClick={onClose}>
        X
      </button>

      <div className="l-column gap-8">
        <select
          className="border border-black p-4"
          value={currentPlace?.placeID || ""}
          onChange={(e) => {
            // if no place selected, use defaults
            const place = JSON.parse(e.target.value) || {
              placeID: "",
              name: "Untitled Event",
            };

            invariant(place.placeID !== undefined);
            invariant(place.name !== undefined);

            const newEvent = {
              ...event,
              placeID: place.placeID,
              title: place.name,
            };

            setEvent(newEvent);
          }}
        >
          {/* only show empty option if no event has been selected */}
          {/* otherwise, show current option as first in the list */}
          {currentPlace ? (
            <option
              key={currentPlace.placeID}
              value={JSON.stringify(currentPlace)}
            >
              {currentPlace.name}
            </option>
          ) : (
            <option key="" value="" />
          )}

          {favoritePlaces
            .filter((place) => place.placeID !== event.placeID)
            .sort((a, b) =>
              (a.name || "").toLocaleLowerCase().localeCompare(b.name || ""),
            )
            .map((place) => (
              <option key={place.placeID} value={JSON.stringify(place)}>
                {place.name}
              </option>
            ))}
        </select>

        <input
          type="time"
          className="border border-black p-4"
          defaultValue={startTime}
          onChange={(e) => {
            const start = roundMinutes(
              `${startDate} ${e.target.value}`, // FIXME: put join in util
              DEFAULT_MIN_TIME_INCREMENT,
            );
            const { hours: dh, minutes: dm } = extractHoursMinutes(duration);
            const end = incrementDateTime(start, dh, dm);

            setEvent({
              ...event,
              start,
              end,
            });
          }}
        />

        <input
          type="text"
          className="border border-black p-4"
          placeholder="duration"
          defaultValue={duration} // FIXME: replace this
          onChange={(e) => {
            const { hours: dh, minutes: dm } = extractHoursMinutes(
              e.target.value,
            );

            const end = roundMinutes(
              incrementDateTime(event.start, dh, dm),
              DEFAULT_MIN_TIME_INCREMENT,
            );

            setEvent({
              ...event,
              end,
            });
          }}
        />
      </div>

      <div className="row justify-between mt-24">
        <button
          className="p-4 hover:opacity-50 border border-black rounded"
          type="submit"
          onClick={onSave}
        >
          Save
        </button>

        {currentPlace && <button onClick={onDelete}>Delete Event</button>}
      </div>
    </div>
  );
}
