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

export const tripsKeyQueryPairs = {
  _base: ["trips"] as const,
  getTripByTripID: {
    key: (tripID: string) => [...tripsKeyQueryPairs._base, tripID],
    query: getTripByTripID,
  },
} as const;
