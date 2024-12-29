import { useState, useEffect } from "react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { PlaceQuerier } from "./PlaceQuerier";
import { useQuery } from "@tanstack/react-query";
import { MapBoxPlace } from "./types";
import { invariant, useNavigate } from "@tanstack/react-router";

interface MapBoxProps {
  googleMapsAPIKey: string;
  googleMapsMapID: string;
  initialPlaceID: string | undefined;
}

interface MapBoxComponentProps {
  googleMapsMapID: string;
  initialPlaceID: string | undefined;
}

export function MapBox({
  googleMapsAPIKey,
  googleMapsMapID,
  initialPlaceID,
}: MapBoxProps) {
  return (
    <APIProvider apiKey={googleMapsAPIKey}>
      <MapBoxComponent
        googleMapsMapID={googleMapsMapID}
        initialPlaceID={initialPlaceID}
      />
    </APIProvider>
  );
}

function MapBoxComponent({
  initialPlaceID,
  googleMapsMapID,
}: MapBoxComponentProps) {
  const map = useMap();
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const [selectedPlace, setSelectedPlace] = useState<MapBoxPlace | null>(null);
  const {
    data: initialPlace,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["google.maps.PlacesLibrary"], // FIXME: abstract this out somewhere?
    queryFn: async () => {
      if (!initialPlaceID) {
        return null;
      }

      const { Place } = (await google.maps.importLibrary(
        "places",
      )) as google.maps.PlacesLibrary;
      const place = new Place({ id: initialPlaceID });

      await place.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });

      const id = place.id;
      const lat = place.location?.lat();
      const lng = place.location?.lng();
      const name = place.displayName;
      const address = place.formattedAddress;
      const rating = place.rating;
      const num_ratings = place.userRatingCount;
      invariant(lat, "lat must have a value");
      invariant(lng, "lng must have a value");

      return {
        id,
        name,
        address,
        lat,
        lng,
        rating,
        num_ratings,
      };
    },
  });

  // if an initial place was provided to MapBox, set selected place to it
  useEffect(() => {
    if (initialPlace) {
      setSelectedPlace(initialPlace);
    }
  }, [initialPlace]);

  // every time user selects a new place, adjust map bounds to keep it in frame
  useEffect(() => {
    if (map && selectedPlace) {
      const { lat, lng } = selectedPlace;
      const delta = 0.005;
      const swCorner = new google.maps.LatLng(lat - delta, lng - delta);
      const neCorner = new google.maps.LatLng(lat + delta, lng + delta);
      map.fitBounds(new google.maps.LatLngBounds(swCorner, neCorner));
    }
  }, [map, selectedPlace]);

  if (isLoading) {
    return <div> Loading ... </div>; // FIXME: gimme a real loading spinny
  }

  if (error) {
    alert(error); // FIXME: impl real error page
  }

  const center = initialPlace
    ? { lat: initialPlace.lat, lng: initialPlace.lng }
    : { lat: 40.735, lng: -73.96 }; // FIXME: how to generate this center?

  // when user selects a new place, adjust URL placeID search param
  const onPlaceSelect = (place: MapBoxPlace) => {
    navigate({ search: { placeID: place.id } }); // FIXME: include name, lat, lng?
    setSelectedPlace(place);
  };

  return (
    <>
      <PlaceQuerier map={map} onPlaceSelect={onPlaceSelect} />
      <Map
        mapId={googleMapsMapID}
        style={{ width: "100%", height: "100%" }}
        defaultCenter={center}
        defaultZoom={initialPlace ? 17 : 13}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      />
      {selectedPlace && (
        <AdvancedMarker
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
        >
          <div className="bg-white border border-black rounded-lg p-24">
            <p className="text-16">{selectedPlace.name}</p>
            <p className="text-14 font-light">{selectedPlace.address}</p>

            {/* FIXME: include photo, link to maps, price? */}
            {/* <p> {selectedPlace?.price_level} </p> */}
          </div>
        </AdvancedMarker>
      )}
    </>
  );
}
