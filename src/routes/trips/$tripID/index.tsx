import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { usersKeyQueryPairs } from "../../../api/users/queries";
import { getAuthorizedUser } from "../../../database/auth";
import { MapBox } from "../../../ui/map/MapBox";
import { tripsKeyQueryPairs } from "../../../api/trips/queries";
import { Scheduler } from "../../../ui/scheduler/Scheduler";
import { APIProvider, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { getPlaceByPlaceID } from "../../../ui/map/util";
import { MapBoxPlace } from "../../../ui/map/types";

export const Route = createFileRoute("/trips/$tripID/")({
  component: () => (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <TripComponent />
    </APIProvider>
  ),
  validateSearch: (search) => ({
    placeID: search.placeID as string | undefined, // FIXME: validate + add initial lat/long for map
    // selectedDate: search.selectedDate as string | undefined,
  }),
  loaderDeps: ({ search: { placeID } }) => ({ placeID }),
  loader: async ({ params }) => {
    const { email } = await getAuthorizedUser();
    const tripID = params.tripID;
    const [user, trip] = await Promise.all([
      usersKeyQueryPairs.getUserByEmail.query(email),
      tripsKeyQueryPairs.getTripByTripID.query(tripID),
    ]);

    // FIXME: make sure trip is under this user id lol
    return { user, trip };
  },
});

function TripComponent() {
  // const navigate = useNavigate({ from: "/" });
  // const searchParams = Route.useSearch();
  const { user, trip } = Route.useLoaderData();
  const [
    { data: stops, isLoading: stopsLoading, error: stopsError },
    { data: favorites, isLoading: favoritesLoading, error: favoritesError },
  ] = useQueries({
    queries: [
      {
        queryKey: tripsKeyQueryPairs.getStopsByTripID.key(trip.id),
        queryFn: () => tripsKeyQueryPairs.getStopsByTripID.query(trip.id),
      },
      {
        queryKey: usersKeyQueryPairs.getFavoritesByUserID.key(user.id),
        queryFn: () => usersKeyQueryPairs.getFavoritesByUserID.query(user.id),
      },
    ],
  });

  const [schedulerOpen, setSchedulerOpen] = useState(
    // searchParams.selectedDate !== undefined,
    true,
  );
  const [favoritePlaces, setFavoritePlaces] = useState<MapBoxPlace[]>([]);
  const [stopPlaces, setStopPlaces] = useState<MapBoxPlace[]>([]);
  const map = useMap();
  const places = useMapsLibrary("places");
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  // initialize the PlacesService after places, map libraries load
  useEffect(() => {
    if (places && map) {
      setPlacesService(new places.PlacesService(map));
    }
  }, [places, map]);

  // useEffect(() => {
  //   setSchedulerOpen(searchParams.selectedDate !== undefined);
  // }, [searchParams.selectedDate]);

  // load details for all favorited places (FIXME: extract this pattern into util as hook)
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

  if (stopsLoading || favoritesLoading) {
    return <div> loading... </div>; // FIXME: blah blah
  }

  if (stopsError || favoritesError) {
    throw stopsError || favoritesError; // FIXME: blah
  }

  // FIXME: user city / initial lat,lng
  // FIXME: add settings page to change trip details
  // FIXME: refactor scheduler open/close state into scheduler
  return (
    <div className="grid grid-rows-[auto_1fr] h-[100vh] text-16 font-sans">
      <nav className="row justify-between text-24 p-12">
        <Link to="/profile"> {user.email} </Link>
        <p
          onClick={() => {
            setSchedulerOpen(true);
            // navigate({
            //   to: "/trips/$tripID",
            //   params: { tripID: trip.id },
            //   // search: { ...searchParams, selectedDate: trip.start_date },
            // });
          }}
        >
          Trip: {trip.name}
        </p>
      </nav>

      <div className="relative w-[100%]">
        <MapBox
          map={map}
          places={places}
          placesService={placesService}
          userID={user.id}
          tripID={trip.id}
          favoritePlaces={favoritePlaces}
          stopPlaces={stopPlaces}
          // stopPlaceIDs={[
          //   // don't mark the same place multiple times
          //   ...new Set(stops?.map(({ place_id }) => place_id)),
          // ]}
          // favoritePlaceIDs={favorites?.map(({ place_id }) => place_id) || []}
        />
      </div>

      <div className="fixed z-50 top-0 right-0">
        {schedulerOpen && (
          <Scheduler
            // key={searchParams.selectedDate}
            tripID={trip.id}
            favoritePlaces={favoritePlaces || []}
            startDate={trip.start_date}
            endDate={trip.end_date}
            events={
              stops?.map((stop) => ({
                id: stop.id.toString(), // FIXME: id gen?
                placeID: stop.place_id,
                title: stop.title || "Untitled Event",
                start: `${stop.start_date} ${stop.start_time}`,
                end: `${stop.end_date} ${stop.end_time}`,
              })) || []
            }
            onClose={() => {
              setSchedulerOpen(false);
              // navigate({
              //   to: "/trips/$tripID",
              //   params: { tripID: trip.id },
              //   search: { ...searchParams, selectedDate: undefined },
              // });
            }}
          />
        )}
      </div>
    </div>
  );
}
