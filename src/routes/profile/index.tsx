import {
  createFileRoute,
  invariant,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usersKeyQueryPairs } from "../../api/users/queries";
import { getAuthorizedUser, handleSignOut } from "../../database/auth";
import { createTrip } from "../../api/trips/mutations";
import { createUser } from "../../api/users/mutations";
import { tripsKeyQueryPairs } from "../../api/trips/queries";

export const Route = createFileRoute("/profile/")({
  component: ProfileComponent,
  loader: async () => {
    const { email, name } = await getAuthorizedUser();
    createUser({ email, name }); // fire and forget lol

    return { email, name };
  },
});

function ProfileComponent() {
  const navigate = useNavigate({ from: "/" });
  const { email, name } = Route.useLoaderData();
  const {
    data: user,
    isLoading: userLoading,
    error: userError,
  } = useQuery({
    queryKey: usersKeyQueryPairs.getUserByEmail.key(email),
    queryFn: () => usersKeyQueryPairs.getUserByEmail.query(email),
  });

  if (userLoading) {
    return <span>Loading...</span>; // FIXME: abstract this out somewhere?
  }
  if (userError) {
    return <span>Error: {userError.message}</span>; // FIXME: impl real error page
  }

  invariant(user, "user must exist in db");

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
          const { tripID } = await createTrip(user.id, {
            name: "California!",
            startDate: "2025-01-02",
            endDate: "2025-01-06",
          });

          navigate({
            to: "/trips/$tripID",
            params: { tripID },
            search: { placeID: "" },
          });
        }}
      >
        Create a new trip!
        {/* <Link>Create a new trip!</Link> */}
      </button>

      <hr />
      <Trips user={user} />
    </div>
  );
}

// FIXME: clean up, refactor this
function Trips({
  user,
}: {
  user: { id: string; email: string; name: string };
}) {
  const {
    data: trips,
    isLoading: tripsLoading,
    error: tripsError,
  } = useQuery({
    queryKey: tripsKeyQueryPairs.getTripsByUserID.key(user.id),
    queryFn: () => tripsKeyQueryPairs.getTripsByUserID.query(user.id),
  });

  if (tripsLoading) {
    return <span>Loading...</span>; // FIXME: abstract this out somewhere?
  }
  if (tripsError) {
    return <span>Error: {tripsError.message}</span>; // FIXME: impl real error page
  }

  return (
    <>
      <p> Current trips: </p>
      <ul>
        {trips &&
          trips.map(({ id, name }) => (
            <li key={id} className="p-12 bg-green-200 hover:opacity-80">
              <Link
                to="/trips/$tripID"
                params={{ tripID: id }}
                search={{ placeID: "" }}
              >
                Trip: {name} ({id})
              </Link>
            </li>
          ))}
      </ul>
    </>
  );
}
