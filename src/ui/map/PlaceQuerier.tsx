import { useRef, useEffect, useState } from "react";
import { invariant } from "@tanstack/react-router";
import { MapBoxPlace } from "./types";
import { getPlacePhotoURL } from "./util";

interface Props {
  map: google.maps.Map | null;
  places: google.maps.PlacesLibrary | null;
  onPlaceSelect: (place: MapBoxPlace) => void;
}

export function PlaceQuerier({ map, places, onPlaceSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // initialize the autocomplete querier on load
  useEffect(() => {
    const options = {
      bounds: map?.getBounds(),
      fields: [
        "place_id",
        "geometry",
        "name",
        "formatted_address",
        "rating",
        "user_ratings_total",
        // "price_level",
        // "types",
        // "website",
        // "formatted_phone_number",
        // "international_phone_number",
        // "opening_hours",
        // "business_status",
      ],
    };

    if (places && inputRef.current) {
      setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
    }
  }, [places, map]);

  // when new place is selected, load details from place API into state
  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener("place_changed", () => {
      const place = placeAutocomplete.getPlace();
      const placeID = place.place_id;
      const name = place.name;
      const address = place.formatted_address;
      const lat = place.geometry?.location?.lat();
      const lng = place.geometry?.location?.lng();
      const rating = place.rating;
      const numRatings = place.user_ratings_total;
      const photoURL = getPlacePhotoURL(place.photos);
      invariant(placeID, "placeID must have a value");
      invariant(lat, "lat must have a value");
      invariant(lng, "lng must have a value");

      onPlaceSelect({
        placeID,
        name,
        address,
        lat,
        lng,
        rating,
        numRatings,
        photoURL,
      });
    });
  }, [onPlaceSelect, placeAutocomplete]);

  map?.addListener("bounds_changed", () => {
    placeAutocomplete?.setBounds(map.getBounds());
  });

  return (
    <div className="absolute top-16 left-16 z-20 border border-black rounded">
      <input ref={inputRef} className="px-12 py-6 w-[40rem] rounded" />
    </div>
  );
}
