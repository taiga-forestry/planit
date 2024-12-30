import { redirect } from "@tanstack/react-router";
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
  const name = user.user_metadata.name;

  if (!email) {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }

  return { email, name };
};
