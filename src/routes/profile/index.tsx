import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAuthorizedUser, handleSignOut } from "../../database/auth";
import { createTrip } from "../../api/trips/mutations";
import { tripsKeyQueryPairs } from "../../api/trips/queries";

export const Route = createFileRoute("/profile/")({
  component: ProfileComponent,
  loader: async () => await getAuthorizedUser(),
});

function ProfileComponent() {
  const navigate = useNavigate({ from: "/" });
  const { id: userID, email, name } = Route.useLoaderData();
  const {
    data: trips,
    isLoading,
    error,
  } = useQuery({
    queryKey: tripsKeyQueryPairs.getTripsByUserID.key(userID),
    queryFn: () => tripsKeyQueryPairs.getTripsByUserID.query(userID),
  });

  if (isLoading) {
    return <span>Loading...</span>; // FIXME: abstract this out somewhere?
  }
  if (error) {
    return <span>Error: {error.message}</span>; // FIXME: impl real error page
  }

  // FIXME: what to do if user doesnt exist?
  return (
    <div className="text-16">
      <p>
        Logged in as: {name} ({email})
      </p>
      <button
        onClick={handleSignOut}
        className="p-12 m-12 bg-gray-200 hover:opacity-80"
      >
        <Link to="/"> Sign Out </Link>
      </button>

      <hr />

      <button
        className="p-12 bg-gray-200 hover:opacity-80"
        onClick={async () => {
          const { tripID } = await createTrip(userID, {
            name: "California!",
            startDate: "2025-01-02",
            endDate: "2025-01-06",
          });

          navigate({
            to: "/trips/$tripID",
            params: { tripID },
            search: { placeID: undefined },
          });
        }}
      >
        Create a new trip!
      </button>

      <hr />

      <p> Current trips: </p>
      <ul>
        {trips &&
          trips.map(({ id, name }) => (
            <li key={id} className="p-12 bg-green-200 hover:opacity-80">
              <Link
                to="/trips/$tripID"
                params={{ tripID: id }}
                search={{ placeID: undefined }}
              >
                Trip: {name} ({id})
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
