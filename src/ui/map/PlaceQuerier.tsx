import { useRef, useEffect, useState } from "react";
import { MapBoxPlace } from "./types";
import { validateAndCachePlace } from "./util";

interface Props {
  map: google.maps.Map | null;
  places: google.maps.PlacesLibrary | null;
  onPlaceSelect: (place: MapBoxPlace) => void;
}

export function PlaceQuerier({ map, places, onPlaceSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [placeAutocomplete, setPlaceAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  // ensures event listeners are only added once => fixes weird placequerier interaction bugs
  const placeChangedListenerRef = useRef<google.maps.MapsEventListener | null>(
    null,
  );
  const boundsChangedListenerRef = useRef<google.maps.MapsEventListener | null>(
    null,
  );

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
        "photos",
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

    if (!placeChangedListenerRef.current) {
      placeChangedListenerRef.current = placeAutocomplete.addListener(
        "place_changed",
        () => {
          const place = placeAutocomplete.getPlace();
          onPlaceSelect(validateAndCachePlace(place));
        },
      );
    }

    return () => {
      if (placeChangedListenerRef.current) {
        placeChangedListenerRef.current.remove();
        placeChangedListenerRef.current = null;
      }
    };
  }, [onPlaceSelect, placeAutocomplete]);

  // when map bounds change, ensure autocomplete maintains relevant local results
  useEffect(() => {
    if (!map || !placeAutocomplete) return;

    if (!boundsChangedListenerRef.current) {
      boundsChangedListenerRef.current = map.addListener(
        "bounds_changed",
        () => {
          placeAutocomplete.setBounds(map.getBounds());
        },
      );
    }

    return () => {
      if (boundsChangedListenerRef.current) {
        boundsChangedListenerRef.current.remove();
        boundsChangedListenerRef.current = null;
      }
    };
  }, [map, placeAutocomplete]);

  return (
    <div className="absolute top-16 left-16 z-20 border border-black rounded">
      <input ref={inputRef} className="px-12 py-6 w-[40rem] rounded" />
    </div>
  );
}
