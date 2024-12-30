import { invariant } from "@tanstack/react-router";
import supabaseClient from "../../database/client";

// export const addPlaceToTrip = async (tripID, fields: { placeID }) => {
// };

// export const addUserToTrip = async (tripID, fields: { userID }) => {
// };

export const createTrip = async (
  userID: string,
  fields: { name: string; startDate: string; endDate: string },
) => {
  const { data, error: tripCreationError } = await supabaseClient
    .from("trips")
    .insert({
      name: fields.name,
      start_date: fields.startDate,
      end_date: fields.endDate,
    })
    .select("id")
    .single();

  if (tripCreationError) {
    throw tripCreationError;
  }

  const tripID = data.id;
  invariant(tripID, "trip must have an id");

  const { error: tripAssignmentError } = await supabaseClient
    .from("trips_users")
    .insert({
      trip_id: tripID,
      user_id: userID,
    });

  if (tripAssignmentError) {
    throw tripAssignmentError;
  }

  return { tripID };
};

// export const updateTrip = async (tripID, fields: { name, dates }) => {
// };

// export const deleteTrip = async (tripID) => {
// };

// const tripsKeys = {
// }
