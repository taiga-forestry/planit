import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Map } from "@vis.gl/react-google-maps";
import { PlaceQuerier } from "./PlaceQuerier";
import { MapBoxPlace } from "./types";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { getPlaceByPlaceID } from "./util";
import { PlaceInfoWindow } from "./PlaceInfoWindow";
import { MapMarker } from "./MapMarker";
import { createFavoriteForUser } from "../../api/users/mutations";
import { Event } from "../scheduler/types";

interface Props {
  map: google.maps.Map | null;
  places: google.maps.PlacesLibrary | null;
  placesService: google.maps.places.PlacesService | null;
  userID: string;
  favoritePlaces: MapBoxPlace[];
  stopPlaces: MapBoxPlace[];
  events: Event[];
}

export function MapBox({
  map,
  places,
  placesService,
  userID,
  stopPlaces,
  favoritePlaces,
  events,
}: Props) {
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const searchParams = getRouteApi("/trips/$tripID/").useSearch();
  const queryClient = useQueryClient();
  const [selectedPlace, setSelectedPlace] = useState<MapBoxPlace | null>(null);

  // if given an initialPlaceID, find relevant info w/ the PlacesService
  useEffect(() => {
    if (searchParams.placeID && placesService) {
      getPlaceByPlaceID(placesService, searchParams.placeID, setSelectedPlace);
    }
  }, [searchParams.placeID, placesService]);

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
    navigate({
      search: {
        ...searchParams,
        placeID: place.placeID,
      },
    }); // FIXME: include name, lat, lng?
    setSelectedPlace(place);
  };

  // when user closes window/otherwise unselects place, adjust URL + state
  const onPlaceUnselect = () => {
    navigate({
      to: window.location.pathname,
      search: { ...searchParams, placeID: undefined },
    });
    setSelectedPlace(null);
  };

  const computeDefaultCenter = () => {
    // FIXME: compute this based on trip, i.e. starting in NY, LA, etc...
    return { lat: 40.735, lng: -73.96 };
  };

  const renderMarkers = (
    places: MapBoxPlace[],
    variant: "stop" | "favorite",
  ) => {
    const selectedDate = searchParams.selectedDate;
    const placesOnSelectedDate = selectedDate
      ? events.filter((event) => event.start.includes(selectedDate))
      : events;

    return places
      .filter(({ placeID }) => {
        // only render favorite marker if no stop marker exists
        if (variant === "favorite") {
          return !stopPlaces.some((stop) => stop.placeID === placeID);
        }

        return true;
      })
      .map(({ placeID, lat, lng }) => (
        <MapMarker
          key={`${variant} MapMarker: ${placeID}`}
          lat={lat}
          lng={lng}
          variant={variant}
          isFaded={
            selectedDate !== undefined &&
            !placesOnSelectedDate.some((place) => place.placeID === placeID)
          }
          onClick={() => {
            if (placesService) {
              getPlaceByPlaceID(placesService, placeID, onPlaceSelect);
            }
          }}
        />
      ));
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
              !favoritePlaces?.find(
                ({ placeID }) => placeID === selectedPlace.placeID,
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

        {/* FIXME: add options to filter markedPlaces (i.e. only today) */}
        {renderMarkers(favoritePlaces, "favorite")}
        {renderMarkers(stopPlaces, "stop")}
      </Map>
    </>
  );
}
