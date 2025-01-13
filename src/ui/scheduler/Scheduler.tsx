import { useEffect, useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
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
  calendarControlsPlugin,
} from "./util";
import { MapBoxPlace } from "../map/types";
import { AnimatePresence, motion } from "framer-motion";
import "@schedule-x/theme-default/dist/index.css";
// import "@schedule-x/theme-shadcn/dist/index.css";
import "./styles.css";

interface Props {
  startDate: string;
  endDate: string;
  events: Event[];
  favoritePlaces: MapBoxPlace[];
}

export function Scheduler({
  startDate,
  endDate,
  events,
  favoritePlaces,
}: Props) {
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const params = getRouteApi("/trips/$tripID/").useParams();
  const searchParams = getRouteApi("/trips/$tripID/").useSearch();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (searchParams.selectedDate) {
      calendarControlsPlugin.setDate(searchParams.selectedDate);
    }
  }, [searchParams.selectedDate]);

  const calendar = useCalendarApp({
    selectedDate: searchParams.selectedDate, // e.g. "2023-12-24"
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
      calendarControlsPlugin,
    ],
    // theme: "shadcn",
    callbacks: {
      onSelectedDateUpdate: (date) => {
        setSelectedEvent(null);
        navigate({
          to: "/trips/$tripID",
          params: { tripID: params.tripID },
          search: { ...searchParams, selectedDate: date },
        });
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

        setTimeout(() => {
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
        }, 200);
      },
      // onBeforeEventUpdate: (e1, e2, app) => {
      // return true;
      // },
      onEventUpdate: async ({ id, placeID, title, start, end }) => {
        // FIXME: clean this up, validate
        await createStopForTrip(
          params.tripID,
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

  return (
    <div className="w-[400px] relative bg-white">
      <ScheduleXCalendar calendarApp={calendar} />

      <button
        className="absolute top-0 left-0 text-24 p-16"
        onClick={() => {
          navigate({
            to: "/trips/$tripID",
            params: { tripID: params.tripID },
            search: { ...searchParams, selectedDate: undefined },
          });
        }}
      >
        <i className="fas fa-arrow-right hover:opacity-60 transition" />
      </button>

      {/* FIXME: modal positioning */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            className="absolute z-40 top-[30%] left-[25%]"
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
                    params.tripID,
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
                      params.tripID,
                      selectedEvent.id,
                      queryClient,
                    );
                    calendar.events.remove(selectedEvent.id);
                    setSelectedEvent(null);
                  } catch (e) {
                    console.log(e);
                  }
                }
              }}
              onClose={() => setSelectedEvent(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
