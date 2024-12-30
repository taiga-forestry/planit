import { invariant } from "@tanstack/react-router";

const getPlaceByPlaceID = async (placeID: string) => {
  const baseURL = "https://places.googleapis.com/v1/places";
  const fields = [
    "displayName",
    "formattedAddress",
    "location",
    "rating",
    "userRatingCount",
  ];
  const response = await fetch(
    `${baseURL}/${placeID}?fields=${fields.join(",")}&key=${import.meta.env.VITE_GOOGLE_PLACES_API_KEY}`,
  );
  const place = await response.json();
  const lat = place.location.latitude;
  const lng = place.location.longitude;
  const name = place.displayName.text;
  const address = place.formattedAddress;
  const rating = place.rating;
  const numRatings = place.userRatingCount;

  // FIXME: validate this (with zod?) or smth else lol
  invariant(typeof lat === "number");
  invariant(typeof lng === "number");
  // invariant(typeof name === "string");
  // invariant(typeof address === "string");
  // invariant(typeof rating === "number");
  // invariant(typeof num_ratings === "number");

  return {
    id: placeID,
    lat,
    lng,
    name,
    address,
    rating,
    numRatings,
  };
};

export const googlePlacesKeyQueryPairs = {
  _base: ["google", "places"] as const,
  getPlaceByPlaceID: {
    key: (placeID: string) => [...googlePlacesKeyQueryPairs._base, placeID],
    query: getPlaceByPlaceID,
  },
} as const;
