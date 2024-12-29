import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { usersKeyQueryPairs } from "../../api/users/queries";
import { getAuthorizedUserEmail } from "../../database/auth";

export const Route = createFileRoute("/profile/")({
  component: ProfileComponent,
  loader: async () => {
    const email = await getAuthorizedUserEmail();
    return { email };
  },
});

function ProfileComponent() {
  const { email } = Route.useLoaderData();
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: usersKeyQueryPairs.getUserByEmail.key(email),
    queryFn: () => usersKeyQueryPairs.getUserByEmail.query(email),
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
      <p> Logged in as: {user?.email}</p>
      <p> Create a new trip! </p>
    </div>
  );
}
