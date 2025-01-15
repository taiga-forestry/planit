import { useState, useEffect } from "react";
import { invariant } from "@tanstack/react-router";
import { MapBoxPlace } from "./types";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

// FIXME: validate cache on put/get, set size limit on cache
const placesCache = {
  get: (key: string) => localStorage.getItem(key),
  put: (key: string, value: MapBoxPlace) =>
    localStorage.setItem(key, JSON.stringify(value)),
  del: (key: string) => localStorage.removeItem(key),
};

export const validateAndCachePlace = (
  place: google.maps.places.PlaceResult,
) => {
  const placeID = place.place_id;
  const lat = place.geometry?.location?.lat();
  const lng = place.geometry?.location?.lng();
  const name = place.name;
  const address = place.formatted_address;
  const rating = place.rating;
  const numRatings = place.user_ratings_total;
  const photoURL = getPlacePhotoURL(place.photos);
  invariant(placeID, "placeID must have a value");
  invariant(lat, "lat must have a value");
  invariant(lng, "lng must have a value");

  const placeObject = {
    placeID,
    lat,
    lng,
    name,
    address,
    rating,
    numRatings,
    photoURL,
  };

  placesCache.put(placeID, placeObject);
  return placeObject;
};

export const getPlaceByPlaceID = (
  placesService: google.maps.places.PlacesService,
  placeID: string,
  callback: (place: MapBoxPlace) => void,
) => {
  const cachedPlace = placesCache.get(placeID);

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
        "photos",
      ],
    },
    (place) => {
      // FIXME: check status on this
      if (place) {
        callback(validateAndCachePlace(place));
      }
    },
  );
};

export const getPlacePhotoURL = (
  photos: google.maps.places.PlacePhoto[] | undefined,
) => {
  const photoURL =
    photos && photos.length > 0
      ? photos[0].getUrl({ maxWidth: 300, maxHeight: 300 })
      : "/public/images/no-maps-image.jpg";

  return photoURL;
};

export const useMapUtils = () => {
  const map = useMap();
  const places = useMapsLibrary("places");
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  // initialize the PlacesService after places, map libraries load
  useEffect(() => {
    if (places && map) {
      setPlacesService(new places.PlacesService(map));
    }
  }, [places, map]);

  return { map, places, placesService };
};
