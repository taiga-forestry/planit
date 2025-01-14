import { useState, useEffect } from "react";
import { invariant } from "@tanstack/react-router";
import { MapBoxPlace } from "./types";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

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
        // "photos",
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
        // const photos = place.photos || [];
        // const photoURL =
        //   photos.length > 0
        //     ? photos[0].getUrl({ maxWidth: 300, maxHeight: 300 })
        //     : "FIXME: placeholder";
        invariant(lat && lng, "place must have a latitude, longitude");

        const placeObject = {
          placeID,
          lat,
          lng,
          name,
          address,
          rating,
          numRatings,
          // photoURL,
        };

        cache.put(placeID, placeObject);
        callback(placeObject);
      }
    },
  );
};

export const useMapUtils = () => {
  const map = useMap();
  const places = useMapsLibrary("places");
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  // initialize the PlacesService after places, map libraries load
  // FIXME: extract this into a hook (in general, look at all uses of useState/useEffect) SOME SHIT IS SLOW
  useEffect(() => {
    if (places && map) {
      setPlacesService(new places.PlacesService(map));
    }
  }, [places, map]);

  return { map, places, placesService };
};

export const useLoadedPlaces = (
  placeIDs: string[],
  placesService: google.maps.places.PlacesService | null,
) => {
  const places: MapBoxPlace[] = [];

  if (placesService) {
    placeIDs.forEach((placeID) => {
      getPlaceByPlaceID(placesService, placeID, (place) => {
        places.push(place);
      });
    });
  }

  return places;
};
