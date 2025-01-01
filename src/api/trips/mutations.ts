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

export const createPlaceForTrip = async (
  tripID: string,
  fields: { placeID: string; date: string; time: string },
) => {
  const { error } = await supabaseClient.from("trips_places").insert({
    trip_id: tripID,
    place_id: fields.placeID,
    date: fields.date,
    time: fields.time,
  });

  if (error) {
    throw error;
  }

  // FIXME: auto revalidate the query?
};

// export const updateTrip = async (tripID, fields: { name, dates }) => {
// };

// export const deleteTrip = async (tripID) => {
// };

// const tripsKeys = {
// }
