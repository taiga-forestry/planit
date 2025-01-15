import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getAuthorizedUser } from "../../../database/auth";
import { MapBox } from "../../../ui/map/MapBox";
import { tripsKeyQueryPairs } from "../../../api/trips/queries";
import { Scheduler } from "../../../ui/scheduler/Scheduler";
import { APIProvider } from "@vis.gl/react-google-maps";
import { getPlaceByPlaceID, useMapUtils } from "../../../ui/map/util";
import { MapBoxPlace } from "../../../ui/map/types";

export const Route = createFileRoute("/trips/$tripID/")({
  component: () => (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <TripComponent />
    </APIProvider>
  ),
  validateSearch: (search) => ({
    placeID: search.placeID as string | undefined, // FIXME: validate + add initial lat/long for map
    selectedDate: search.selectedDate as string | undefined,
  }),
  // loaderDeps: ({ search: { placeID } }) => ({ placeID }),
  beforeLoad: async () => {
    await getAuthorizedUser();
  },
  loader: async ({ params }) => {
    const tripID = params.tripID;
    const trip = await tripsKeyQueryPairs.getTripByTripID.query(tripID);

    // FIXME: make sure trip is under this user id lol
    return { trip };
  },
});

function TripComponent() {
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const searchParams = Route.useSearch();
  const { trip } = Route.useLoaderData();
  const { map, places, placesService } = useMapUtils();
  const [
    { data: favorites, isLoading: favoritesLoading, error: favoritesError },
    { data: stops, isLoading: stopsLoading, error: stopsError },
  ] = useQueries({
    queries: [
      {
        queryKey: tripsKeyQueryPairs.getFavoritesByTripID.key(trip.id),
        queryFn: () => tripsKeyQueryPairs.getFavoritesByTripID.query(trip.id),
      },
      {
        queryKey: tripsKeyQueryPairs.getStopsByTripID.key(trip.id),
        queryFn: () => tripsKeyQueryPairs.getStopsByTripID.query(trip.id),
      },
    ],
  });

  const [favoritePlaces, setFavoritePlaces] = useState<MapBoxPlace[]>([]);
  const [stopPlaces, setStopPlaces] = useState<MapBoxPlace[]>([]);

  useEffect(() => {
    if (placesService) {
      const loadPlaces = (
        placeIDs: string[],
        setPlaces: (places: MapBoxPlace[]) => void,
      ) => {
        const places: MapBoxPlace[] = [];
        if (placeIDs.length === 0) {
          return setFavoritePlaces([]);
        }
        placeIDs.forEach((placeID) => {
          getPlaceByPlaceID(placesService, placeID, (place) => {
            places.push(place);
            if (places.length === placeIDs.length) {
              setPlaces(places);
            }
          });
        });
      };
      // FIXME: clean this
      loadPlaces(
        [...new Set(favorites?.map(({ place_id }) => place_id))],
        setFavoritePlaces,
      );
      loadPlaces(
        [...new Set(stops?.map(({ place_id }) => place_id))],
        setStopPlaces,
      );
    }
  }, [placesService, favorites, stops]);

  const [schedulerOpen, setSchedulerOpen] = useState(
    searchParams.selectedDate !== undefined,
  );

  if (stopsLoading || favoritesLoading) {
    return <div> loading... </div>; // FIXME: blah blah
  }

  if (stopsError || favoritesError) {
    throw stopsError || favoritesError; // FIXME: blah
  }

  const events =
    stops?.map((stop) => ({
      id: stop.id.toString(), // FIXME: id gen?
      placeID: stop.place_id,
      title: stop.title || "Untitled Event",
      start: `${stop.start_date} ${stop.start_time}`,
      end: `${stop.end_date} ${stop.end_time}`,
    })) || [];

  // FIXME: user city / initial lat,lng
  return (
    <div className="grid grid-rows-[auto_1fr] h-[100vh] text-16 font-sans">
      <nav className="row justify-between text-24 p-12">
        <Link to="/profile">
          <i className="fas fa-home hover:opacity-70 transition" />
        </Link>
        <p> {trip.name} </p>

        <div className="row gap-24">
          {/* FIXME: add explorer support! */}
          <button>
            <i className="fas fa-compass hover:opacity-70 transition" />
          </button>

          {/* FIXME: preserve last opened date? */}
          <button
            onClick={() => {
              setSchedulerOpen(!schedulerOpen);
              navigate({
                search: {
                  ...searchParams,
                  selectedDate: trip.start_date,
                },
              });
            }}
          >
            <i className="fas fa-calendar hover:opacity-70 transition" />
          </button>

          {/* // FIXME: add settings to change trip details (start/end date, min/max times, name, publicity, etc.) */}
          <button>
            <i className="fas fa-gear hover:opacity-70 transition" />
          </button>
        </div>
      </nav>

      <div className="relative w-[100%]">
        <MapBox
          map={map}
          places={places}
          placesService={placesService}
          favoritePlaces={favoritePlaces}
          stopPlaces={stopPlaces}
          events={events}
        />
      </div>

      <div className="fixed z-30 top-0 right-0">
        <Scheduler
          startDate={trip.start_date}
          endDate={trip.end_date}
          events={events}
          favoritePlaces={favoritePlaces || []}
          isOpen={schedulerOpen}
          setIsOpen={setSchedulerOpen}
        />
      </div>
    </div>
  );
}
