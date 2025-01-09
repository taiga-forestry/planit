import { QueryClient } from "@tanstack/react-query";
import { invariant } from "@tanstack/react-router";
import { tripsKeyQueryPairs } from "./queries";
import { extractDateTime } from "../../ui/scheduler/util";
import supabaseClient from "../../database/client";

// export const addPlaceToTrip = async (tripID, fields: { placeID }) => {
// };

// export const addUserToTrip = async (tripID, fields: { userID }) => {
// };

// FIXME: sanitize input for all API/db calls

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

// FIXME: allow specification for duration/end
export const createStopForTrip = async (
  tripID: string,
  fields: { placeID: string; title: string; start: string; end: string },
  queryClient?: QueryClient,
) => {
  const { date: start_date, time: start_time } = extractDateTime(fields.start);
  const { date: end_date, time: end_time } = extractDateTime(fields.end);

  const { error } = await supabaseClient.from("trips_stops").upsert({
    trip_id: tripID,
    place_id: fields.placeID,
    title: fields.title,
    start_date,
    start_time,
    end_date,
    end_time,
  });

  if (error) {
    throw error;
  }

  if (queryClient) {
    queryClient.invalidateQueries({
      queryKey: tripsKeyQueryPairs.getStopsByTripID.key(tripID),
    });
  }

  // FIXME: auto revalidate the query?
};

// export const updateTrip = async (tripID, fields: { name, dates }) => {
// };

// export const deleteTrip = async (tripID) => {
// };

// const tripsKeys = {
// }
