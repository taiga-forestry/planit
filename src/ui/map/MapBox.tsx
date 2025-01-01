import { useState, useEffect } from "react";
import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { PlaceQuerier } from "./PlaceQuerier";
import { MapBoxPlace } from "./types";
import { useNavigate } from "@tanstack/react-router";
import { getPlaceByPlaceID } from "./util";
import { PlaceInfoWindow } from "./PlaceInfoWindow";
import { MapMarker } from "./MapMarker";
import { createPlaceForTrip } from "../../api/trips/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { tripsKeyQueryPairs } from "../../api/trips/queries";

interface Props {
  tripID: string;
  initialPlaceID: string | undefined;
  markedPlaceIDs: string[]; // FIXME: rename?
}

export function MapBox({ tripID, initialPlaceID, markedPlaceIDs }: Props) {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <MapBoxComponent
        tripID={tripID}
        initialPlaceID={initialPlaceID}
        markedPlaceIDs={markedPlaceIDs}
      />
    </APIProvider>
  );
}

function MapBoxComponent({ tripID, initialPlaceID, markedPlaceIDs }: Props) {
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const queryClient = useQueryClient();
  const map = useMap();
  const places = useMapsLibrary("places");
  const [selectedPlace, setSelectedPlace] = useState<MapBoxPlace | null>(null);
  const [markedPlaces, setMarkedPlaces] = useState<MapBoxPlace[] | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  // initialize the PlacesService on load
  useEffect(() => {
    if (places && map) {
      setPlacesService(new places.PlacesService(map));
    }
  }, [places, map]);

  // if given an initialPlaceID, find relevant info w/ the PlacesService
  useEffect(() => {
    if (initialPlaceID && placesService) {
      getPlaceByPlaceID(placesService, initialPlaceID, setSelectedPlace);
    }
  }, [initialPlaceID, placesService]); // Effect runs only when initialPlaceID changes

  // when map loads, add all marked places to the map
  useEffect(() => {
    if (placesService) {
      markedPlaceIDs
        // only process placeIDs NOT ALREADY IN markedPlaces state...
        .filter(
          (placeID) =>
            !markedPlaces?.find((place) => place.placeID === placeID),
        )
        // then get place info for these remaining placeIDs to add to markedPlaces
        .forEach((placeID) => {
          getPlaceByPlaceID(placesService, placeID, (place) => {
            setMarkedPlaces((places) => [...(places || []), place]);
          });
        });
    }
  }, [markedPlaceIDs, markedPlaces, placesService]);

  // every time user selects a new place, adjust map bounds to keep user in frame
  useEffect(() => {
    if (map && selectedPlace) {
      const { lat, lng } = selectedPlace;
      const delta = 0.005;
      const swCorner = new google.maps.LatLng(lat - delta, lng - delta);
      const neCorner = new google.maps.LatLng(lat + delta, lng + delta);
      map.fitBounds(new google.maps.LatLngBounds(swCorner, neCorner));
    }
  }, [map, selectedPlace]);

  // when user selects a new place, adjust URL placeID search param
  const onPlaceSelect = (place: MapBoxPlace) => {
    navigate({ search: { placeID: place.placeID } }); // FIXME: include name, lat, lng?
    setSelectedPlace(place);
  };

  // when user closes window/otherwise unselects place, adjust URL + state
  const onPlaceUnselect = () => {
    navigate({
      to: window.location.pathname,
      search: { placeID: undefined },
    });
    setSelectedPlace(null);
  };

  // FIXME: abstract out closing = navigate + set to null
  const computeDefaultCenter = () => {
    // FIXME: compute this based on trip, i.e. starting in NY, LA, etc...
    return { lat: 40.735, lng: -73.96 };
  };

  return (
    <>
      <PlaceQuerier map={map} places={places} onPlaceSelect={onPlaceSelect} />
      <Map
        mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
        style={{ width: "100%", height: "100%" }}
        defaultCenter={computeDefaultCenter()}
        defaultZoom={13}
        minZoom={3}
        maxZoom={21}
        restriction={{
          // don't allow users to scroll off the map!
          strictBounds: true,
          latLngBounds: {
            north: 85,
            south: -85,
            east: 180,
            west: -180,
          },
        }}
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        clickableIcons={false}
      >
        {selectedPlace && (
          <PlaceInfoWindow
            place={selectedPlace}
            onClose={onPlaceUnselect}
            isSaveEnabled={
              !markedPlaces?.find(
                ({ placeID }) => placeID === selectedPlace.placeID,
              )
            }
            onSave={async () => {
              await createPlaceForTrip(tripID, {
                placeID: selectedPlace.placeID,
                date: "2025-01-01",
                time: "01:02:03",
              });

              queryClient.invalidateQueries({
                queryKey: tripsKeyQueryPairs.getPlacesByTripID.key(tripID),
              });

              // auto close info window after saving!
              onPlaceUnselect();
            }}
          />
        )}

        {markedPlaces?.map(({ placeID, lat, lng }) => (
          <MapMarker
            key={placeID}
            lat={lat}
            lng={lng}
            onClick={() => {
              // FIXME: once hotspots is determined, can probably avoid network call here
              if (placesService) {
                getPlaceByPlaceID(placesService, placeID, onPlaceSelect);
              }
            }}
          />
        ))}
      </Map>
    </>
  );
}
