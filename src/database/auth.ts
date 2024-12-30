import { invariant, redirect } from "@tanstack/react-router";
import { usersKeyQueryPairs } from "../api/users/queries";
import { createUser } from "../api/users/mutations";
import supabaseClient from "./client";

export const handleSignIn = async () => {
  const { data: _, error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${import.meta.env.VITE_BASE_URL}/profile`,
    },
  });

  if (error) {
    throw error;
  }

  // FIXME: handle user creation here somehow
};

export const handleSignOut = async () => {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    throw error;
  }

  // FIXME: handle redirect to / here somehow
};

export const getAuthorizedUser = async () => {
  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }

  const email = user.email;

  if (!email) {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }

  // FIXME: need a better solution to avoid calling db each time session is checked
  try {
    return await usersKeyQueryPairs.getUserByEmail.query(email);
  } catch {
    const name = user.user_metadata.name;
    invariant(typeof name === "string");

    const { userID: id } = await createUser({ email, name });
    return { id, email, name };
  }
};
