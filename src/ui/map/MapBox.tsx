import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Map } from "@vis.gl/react-google-maps";
import { PlaceQuerier } from "./PlaceQuerier";
import { MapBoxPlace } from "./types";
import { useNavigate } from "@tanstack/react-router";
import { getPlaceByPlaceID } from "./util";
import { PlaceInfoWindow } from "./PlaceInfoWindow";
import { MapMarker } from "./MapMarker";
import { createFavoriteForUser } from "../../api/users/mutations";

interface Props {
  map: google.maps.Map | null;
  places: google.maps.PlacesLibrary | null;
  placesService: google.maps.places.PlacesService | null;
  userID: string;
  tripID: string;
  initialPlaceID: string | undefined;
  markedPlaceIDs: string[];
  favoritePlaceIDs: string[];
}

export function MapBox({
  map,
  places,
  placesService,
  userID,
  // tripID,
  initialPlaceID,
  markedPlaceIDs,
  favoritePlaceIDs,
}: Props) {
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const queryClient = useQueryClient();
  const [selectedPlace, setSelectedPlace] = useState<MapBoxPlace | null>(null);
  const [markedPlaces, setMarkedPlaces] = useState<MapBoxPlace[] | null>(null);

  // if given an initialPlaceID, find relevant info w/ the PlacesService
  useEffect(() => {
    if (initialPlaceID && placesService) {
      getPlaceByPlaceID(placesService, initialPlaceID, setSelectedPlace);
    }
  }, [initialPlaceID, placesService]);

  // when map loads, add all marked places to the map
  useEffect(() => {
    if (placesService) {
      const newMarkedPlaces: MapBoxPlace[] = [];

      if (markedPlaceIDs.length === 0) {
        return setMarkedPlaces([]);
      }

      markedPlaceIDs.forEach((placeID) => {
        getPlaceByPlaceID(placesService, placeID, (place) => {
          newMarkedPlaces.push(place);

          if (newMarkedPlaces.length === markedPlaceIDs.length) {
            setMarkedPlaces(newMarkedPlaces);
          }
        });
      });
    }
  }, [placesService, markedPlaceIDs]);

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
        gestureHandling="greedy"
        disableDefaultUI={true}
        clickableIcons={false}
      >
        {selectedPlace && (
          <PlaceInfoWindow
            place={selectedPlace}
            onClose={onPlaceUnselect}
            isSaveEnabled={
              !favoritePlaceIDs?.find(
                (placeID) => placeID === selectedPlace.placeID,
              )
            }
            onSave={async () => {
              await createFavoriteForUser(
                userID,
                { placeID: selectedPlace.placeID },
                queryClient,
              );

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
