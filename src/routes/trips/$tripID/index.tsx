import { createFileRoute, Link } from "@tanstack/react-router";
import { usersKeyQueryPairs } from "../../../api/users/queries";
import { getAuthorizedUser } from "../../../database/auth";
import { MapBox } from "../../../ui/map/MapBox";
import { tripsKeyQueryPairs } from "../../../api/trips/queries";

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

  // FIXME: user city / initial lat,lng
  return (
    <div className="grid-cols-[auto_1fr] h-[100vh] text-16 font-sans">
      <nav className="row justify-between text-24 p-12">
        <Link to="/profile"> {user.email} </Link>
        <p> Trip: {trip.name} </p>
      </nav>

      <div className="relative h-full">
        <MapBox initialPlaceID={placeID} />
      </div>
    </div>
  );
}
