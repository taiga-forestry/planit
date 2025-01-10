import supabaseClient from "../../database/client";

const getTripByTripID = async (tripID: string) => {
  const { data: trip, error } = await supabaseClient
    .from("trips")
    .select()
    .eq("id", tripID)
    .single();

  if (error) {
    throw error;
  }

  return trip;
};

const getTripsByUserID = async (userID: string) => {
  const { data, error } = await supabaseClient
    .from("trips_users")
    .select("trips!inner(*)")
    .eq("user_id", userID);

  if (error) {
    throw error;
  }

  return data ? data.map(({ trips }) => trips) : [];
};

const getStopsByTripID = async (tripID: string) => {
  const { data, error } = await supabaseClient
    .from("trips_stops")
    .select()
    .eq("trip_id", tripID);

  if (error) {
    throw error;
  }

  return data.map((stop) => ({
    ...stop,
    start_time: stop.start_time.substring(0, 5), // convert HH:mm:ss -> HH:mm
    end_time: stop.end_time.substring(0, 5),
  }));
};

export const tripsKeyQueryPairs = {
  _base: ["trips"] as const,
  getTripByTripID: {
    key: (tripID: string) => [...tripsKeyQueryPairs._base, tripID],
    query: getTripByTripID,
  },
  getTripsByUserID: {
    key: (userID: string) => [...tripsKeyQueryPairs._base, userID],
    query: getTripsByUserID,
  },
  getStopsByTripID: {
    key: (tripID: string) => [...tripsKeyQueryPairs._base, tripID],
    query: getStopsByTripID,
  },
} as const;
