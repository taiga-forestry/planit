import { createFileRoute, Link } from "@tanstack/react-router";
import { usersKeyQueryPairs } from "../../../api/users/queries";
import { getAuthorizedUser } from "../../../database/auth";
import { MapBox } from "../../../ui/map/MapBox";
import { tripsKeyQueryPairs } from "../../../api/trips/queries";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/trips/$tripID/")({
  component: TripComponent,
  validateSearch: (search) => ({
    placeID: search.placeID as string | undefined, // FIXME: validate?
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
  const { placeID } = Route.useSearch();
  const { user, trip } = Route.useLoaderData();
  const {
    data: places,
    isLoading,
    error,
  } = useQuery({
    queryKey: tripsKeyQueryPairs.getPlacesByTripID.key(trip.id),
    queryFn: () => tripsKeyQueryPairs.getPlacesByTripID.query(trip.id),
  });

  if (isLoading) {
    return <div> loading... </div>; // FIXME: blah blah
  }

  if (error) {
    throw error; // FIXME: blah
  }

  // FIXME: user city / initial lat,lng
  return (
    <div className="grid-cols-[auto_1fr] h-[100vh] text-16 font-sans">
      <nav className="row justify-between text-24 p-12">
        <Link to="/profile"> {user.email} </Link>
        <p> Trip: {trip.name} </p>
      </nav>

      <div className="relative h-full">
        <MapBox
          tripID={trip.id}
          initialPlaceID={placeID}
          markedPlaceIDs={places?.map(({ place_id }) => place_id) || []}
        />
      </div>
    </div>
  );
}
