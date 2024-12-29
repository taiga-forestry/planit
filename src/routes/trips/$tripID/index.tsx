import { createFileRoute } from "@tanstack/react-router";
import { usersKeyQueryPairs } from "../../../api/users/queries";
import { getAuthorizedUserEmail } from "../../../database/auth";
import { MapBox } from "../../../ui/map/MapBox";
import { tripsKeyQueryPairs } from "../../../api/trips/queries";

export const Route = createFileRoute("/trips/$tripID/")({
  component: TripComponent,
  validateSearch: (search) => ({
    placeID: search.placeID as string | undefined,
  }),
  loaderDeps: ({ search: { placeID } }) => ({ placeID }),
  loader: async ({ params }) => {
    const email = await getAuthorizedUserEmail();
    const tripID = params.tripID;
    const [user, trip] = await Promise.all([
      usersKeyQueryPairs.getUserByEmail.query(email),
      tripsKeyQueryPairs.getTripByTripID.query(tripID),
    ]);

    // FIXME: get trip name
    return { user, trip };
  },
});

function TripComponent() {
  const { placeID } = Route.useSearch();
  const { user, trip } = Route.useLoaderData();

  // FIXME: user city / initial lat,lng
  return (
    <div className="grid-cols-[auto_1fr] h-[100vh] text-16 font-sans">
      <nav className="row text-24 justify-between">
        {[user.email, `Trip: ${trip.user_id}`].map((elt) => (
          <div className="p-12" key={elt}>
            {elt}
          </div>
        ))}
      </nav>

      <div className="relative h-full">
        <MapBox initialPlaceID={placeID} />
      </div>
    </div>
  );
}
