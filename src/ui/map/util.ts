import { invariant } from "@tanstack/react-router";
import { MapBoxPlace } from "./types";

// FIXME: validate cache on put/get, set size limit on cache
const cache = {
  get: (key: string) => localStorage.getItem(key),
  put: (key: string, value: MapBoxPlace) =>
    localStorage.setItem(key, JSON.stringify(value)),
  del: (key: string) => localStorage.removeItem(key),
};

export const getPlaceByPlaceID = (
  placesService: google.maps.places.PlacesService,
  placeID: string,
  callback: (place: MapBoxPlace) => void,
) => {
  const cachedPlace = cache.get(placeID);

  if (cachedPlace) {
    return callback(JSON.parse(cachedPlace));
  }

  placesService.getDetails(
    {
      placeId: placeID,
      fields: [
        "name",
        "formatted_address",
        "geometry",
        "rating",
        "user_ratings_total",
      ],
    },
    (place) => {
      if (place) {
        const lat = place.geometry?.location?.lat();
        const lng = place.geometry?.location?.lng();
        const name = place.name;
        const address = place.formatted_address;
        const rating = place.rating;
        const numRatings = place.user_ratings_total;
        invariant(lat && lng, "place must have a latitude, longitude");

        const placeObject = {
          placeID,
          lat,
          lng,
          name,
          address,
          rating,
          numRatings,
        };

        cache.put(placeID, placeObject);
        callback(placeObject);
      }
    },
  );
};

// export const hotspots = [
//   { placeID: "ChIJaXQRs6lZwokRY6EFpJnhNNE" }, // empire state
//   { placeID: "ChIJPTacEpBQwokRKwIlDXelxkA" }, // statue of liberty
//   { placeID: "ChIJK3vOQyNawokRXEa9errdJiU" }, // brooklyn bridge
//   { placeID: "ChIJ4zGFAZpYwokRGUGph3Mf37k" }, // central park
//   { placeID: "ChIJw2lMFL9ZwokRosAtly52YX4" }, // chelsea market
// ];
