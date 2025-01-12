import { useState } from "react";
// import { useNavigate, getRouteApi } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import { createViewDay } from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { createDragAndDropPlugin } from "@schedule-x/drag-and-drop";
import { createResizePlugin } from "@schedule-x/resize";
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
import { AnimatePresence, motion } from "framer-motion";
import "@schedule-x/theme-default/dist/index.css";
import "@schedule-x/theme-shadcn/dist/index.css";
import "./styles.css";
import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";

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
  // const navigate = useNavigate({ from: "/" });
  // const searchParams = getRouteApi("/trips/$tripID/").useSearch();
  const queryClient = useQueryClient();
  // const [selectedDate, setSelectedDate] = useState(searchParams.selectedDate);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const calendar = useCalendarApp({
    selectedDate: startDate, // searchParams.selectedDate, // e.g. "2023-12-24"
    minDate: startDate,
    maxDate: endDate,
    dayBoundaries: {
      start: "06:00", // FIXME: configure?
      end: "24:00",
    },
    views: [createViewDay()],
    events,
    plugins: [
      createEventsServicePlugin(),
      createDragAndDropPlugin(DEFAULT_MIN_TIME_INCREMENT),
      createResizePlugin(DEFAULT_MIN_TIME_INCREMENT),
      createCalendarControlsPlugin(),
    ],
    // theme: "shadcn",
    callbacks: {
      onSelectedDateUpdate: (_) => {
        setSelectedEvent(null);
        // setSelectedDate(date);

        // navigate({
        //   to: "/trips/$tripID",
        //   params: { tripID },
        //   search: {
        //     ...searchParams,
        //     selectedDate: date,
        //   },
        // });
      },
      onEventClick: ({ id, placeID, title, start, end }) => {
        // navigate({
        //   to: "/trips/$tripID",
        //   params: { tripID },
        //   search: { placeID },
        // }); // FIXME: do i like this? and if so, what zoom?
        setSelectedEvent(null);

        setTimeout(() => {
          setSelectedEvent({
            id: id.toString(),
            placeID, // FIXME: test placeID can be extracted
            title: title || "",
            start,
            end,
          });
        }, 200);
      },
      onClickDateTime: (datetime) => {
        setSelectedEvent(null);

        // Introduce a slight delay to ensure React processes the intermediate state
        setTimeout(() => {
          // Generate a new event
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

          // Set the new event
          setSelectedEvent(newEvent);
        }, 200); // Minimal delay
      },
      // onBeforeEventUpdate: (e1, e2, app) => {
      // return true;
      // },
      onEventUpdate: async ({ id, placeID, title, start, end }) => {
        // FIXME: clean this up, validate
        await createStopForTrip(
          tripID,
          id.toString(),
          {
            placeID,
            title: title || "",
            start,
            end,
          },
          queryClient,
        );
      },
    },
  });

  // useEffect(() => {
  //   calendar.$app.calendarState.setView("day", searchParams.selectedDate);
  //   calendar.$app.datePickerState.inputDisplayedValue.v =
  //     searchParams.selectedDate;
  // }, [searchParams.selectedDate]);

  return (
    <div className="w-[400px] relative bg-white">
      <ScheduleXCalendar calendarApp={calendar} />

      <button className="absolute top-0 left-0 text-24 p-16" onClick={onClose}>
        <i className="fas fa-arrow-right hover:opacity-60 transition" />
      </button>

      {/* FIXME: modal positioning */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="absolute z-60 top-[30%] left-[25%]"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
          >
            <EventPopup
              key={`EventPopup: ${selectedEvent.id}`} // force remount to reset internal state
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
                } catch (e) {
                  console.log(e); // FIXME: handle all of these properly!
                }
              }}
              onDelete={async () => {
                const existingIds = calendar.events
                  .getAll()
                  .map(({ id }) => id);

                if (existingIds.includes(selectedEvent.id)) {
                  try {
                    await deleteStopForTrip(
                      tripID,
                      selectedEvent.id,
                      queryClient,
                    );
                    calendar.events.remove(selectedEvent.id);
                  } catch (e) {
                    console.log(e);
                  }
                }

                setSelectedEvent(null);
              }}
              onClose={() => setSelectedEvent(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
