import { QueryClient } from "@tanstack/react-query";
import { invariant } from "@tanstack/react-router";
import supabaseClient from "../../database/client";
import { usersKeyQueryPairs } from "./queries";

export const createUser = async (fields: { name: string; email: string }) => {
  const { data, error } = await supabaseClient
    .from("users")
    .upsert([
      {
        name: fields.name,
        email: fields.email,
      },
    ])
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const userID = data.id;
  invariant(userID, "user must have an id");

  return { userID };
};

// export const updateUser = async (
//   userID,
//   fields: { name; email; trip_ids; favorites },
// ) => {};

// export const deleteUser = async (userID) => {};

export const createFavoriteForUser = async (
  userID: string,
  fields: { placeID: string },
  queryClient?: QueryClient,
) => {
  const { error } = await supabaseClient.from("users_favorites").upsert({
    user_id: userID,
    place_id: fields.placeID,
  });

  if (error) {
    throw error;
  }

  if (queryClient) {
    queryClient.invalidateQueries({
      queryKey: usersKeyQueryPairs.getFavoritesByUserID.key(userID),
    });
  }
};

export const deleteFavoriteForUser = async (
  userID: string,
  fields: { placeID: string },
  queryClient?: QueryClient,
) => {
  const { error } = await supabaseClient
    .from("users_favorites")
    .delete()
    .eq("user_id", userID)
    .eq("place_id", fields.placeID);

  if (error) {
    throw error;
  }

  if (queryClient) {
    queryClient.invalidateQueries({
      queryKey: usersKeyQueryPairs.getFavoritesByUserID.key(userID),
    });
  }
};
