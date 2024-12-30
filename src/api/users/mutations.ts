import { invariant } from "@tanstack/react-router";
import supabaseClient from "../../database/client";

export const createUser = async (fields: { name: string; email: string }) => {
  const { data, error } = await supabaseClient
    .from("users")
    .insert([
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
