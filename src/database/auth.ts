import { redirect } from "@tanstack/react-router";
import supabaseClient from "./client";

export const getAuthorizedUserEmail = async () => {
  const {
    data: { session },
    error,
  } = await supabaseClient.auth.getSession();

  if (error) {
    throw error; // FIXME: redirect to error page or smth
  }

  const email = session?.user?.email;
  const x = 1;

  if (!email) {
    throw redirect({ to: "/" }); // search: { redirect: location.href }
  }

  return email;
};
