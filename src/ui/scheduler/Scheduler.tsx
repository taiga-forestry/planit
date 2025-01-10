import { useQueryClient } from "@tanstack/react-query";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import { createViewDay } from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { useState } from "react";
import { EventPopup } from "./EventPopup";
import { Event } from "./types";
import {
  createStopForTrip,
  deleteStopForTrip,
} from "../../api/trips/mutations";
import {
  DEFAULT_MIN_TIME_INCREMENT,
  DEFAULT_HOURS_DURATION,
  DEFAULT_MINUTES_DURATION,
  incrementDateTime,
  roundMinutes,
} from "./util";
import { MapBoxPlace } from "../map/types";
import "@schedule-x/theme-default/dist/index.css";
import "./styles.css";

interface Props {
  tripID: string;
  favoritePlaces: MapBoxPlace[];
  startDate: string;
  endDate: string;
  events: Event[];
  onClose: () => void;
}

export function Scheduler({
  tripID,
  favoritePlaces,
  startDate,
  endDate,
  events,
  onClose,
}: Props) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(startDate);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const calendar = useCalendarApp({
    selectedDate, // e.g. "2023-12-24"
    minDate: startDate,
    maxDate: endDate,
    // dayBoundaries: {
    //   start: "06:00", // FIXME: configure?
    //   end: "24:00",
    // },
    views: [createViewDay()],
    events,
    plugins: [
      createEventsServicePlugin(),
      createDragAndDropPlugin(DEFAULT_MIN_TIME_INCREMENT),
    ],
    callbacks: {
      onSelectedDateUpdate: (date) => {
        setSelectedDate(date);
      },
      onEventClick: ({ id, placeID, title, start, end }) => {
        setSelectedEvent({
          id: id.toString(),
          placeID, // FIXME: test placeID can be extracted
          title: title || "",
          start,
          end,
        });
      },
      onClickDateTime: (datetime) => {
        // FIXME: change id gen to uuid?
        const eventID = Math.floor(Math.random() * 10000).toString();
        const start = roundMinutes(datetime, DEFAULT_MIN_TIME_INCREMENT);
        const end = incrementDateTime(
          start,
          DEFAULT_HOURS_DURATION,
          DEFAULT_MINUTES_DURATION,
        );

        const newEvent = {
          id: eventID,
          placeID: "", // FIXME: compute
          title: "Untitled Event",
          start,
          end,
        };

        setSelectedEvent(newEvent);
      },
      // onBeforeEventUpdate: (e1, e2, app) => {
      // return true;
      // },
      // onEventUpdate: (e) => {}
    },
  });

  return (
    <div className="w-[400px] relative">
      <ScheduleXCalendar calendarApp={calendar} />

      <button className="absolute top-0 left-0 text-24 p-16" onClick={onClose}>
        &gt;
      </button>

      {/* FIXME: modal positioning */}
      {selectedEvent && (
        <div className="absolute z-60 top-[30%] left-[25%]">
          <EventPopup
            favoritePlaces={favoritePlaces}
            event={selectedEvent}
            setEvent={setSelectedEvent}
            onSave={async () => {
              try {
                await createStopForTrip(
                  tripID,
                  selectedEvent.id,
                  {
                    placeID: selectedEvent.placeID,
                    title: selectedEvent.title,
                    start: selectedEvent.start,
                    end: selectedEvent.end,
                  },
                  queryClient,
                );

                const existingIds = calendar.events
                  .getAll()
                  .map(({ id }) => id);

                if (existingIds.includes(selectedEvent.id)) {
                  calendar.events.remove(selectedEvent.id);
                }

                calendar.events.add({ ...selectedEvent });
                setSelectedEvent(null);
              } catch (e: unknown) {
                alert(e);
              }
            }}
            onDelete={async () => {
              // FIXME: disable this button if its a new event?
              const existingIds = calendar.events.getAll().map(({ id }) => id);

              if (existingIds.includes(selectedEvent.id)) {
                try {
                  await deleteStopForTrip(
                    tripID,
                    selectedEvent.id,
                    queryClient,
                  );
                  calendar.events.remove(selectedEvent.id);
                } catch (e: unknown) {
                  alert(e);
                }
              }

              setSelectedEvent(null);
            }}
            onClose={() => setSelectedEvent(null)}
          />
        </div>
      )}
    </div>
  );
}
