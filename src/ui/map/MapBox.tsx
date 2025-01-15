import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Map } from "@vis.gl/react-google-maps";
import { PlaceQuerier } from "./PlaceQuerier";
import { MapBoxPlace } from "./types";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { getPlaceByPlaceID } from "./util";
import { PlaceInfoWindow } from "./PlaceInfoWindow";
import { MapMarker } from "./MapMarker";
import {
  createFavoriteForTrip,
  deleteFavoriteForTrip,
} from "../../api/trips/mutations";
import { Event } from "../scheduler/types";

interface Props {
  map: google.maps.Map | null;
  places: google.maps.PlacesLibrary | null;
  placesService: google.maps.places.PlacesService | null;
  favoritePlaces: MapBoxPlace[];
  stopPlaces: MapBoxPlace[];
  events: Event[];
}

export function MapBox({
  map,
  places,
  placesService,
  stopPlaces,
  favoritePlaces,
  events,
}: Props) {
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const params = getRouteApi("/trips/$tripID/").useParams();
  const searchParams = getRouteApi("/trips/$tripID/").useSearch();
  const queryClient = useQueryClient();
  const [selectedPlace, setSelectedPlace] = useState<MapBoxPlace | null>(null);

  // when URL placeID updates, adjust selectedPlace accordingly
  useEffect(() => {
    const updateSelectedPlaceOnNavigate = async () => {
      if (placesService && searchParams.placeID) {
        const newPlace = await getPlaceByPlaceID(
          placesService,
          searchParams.placeID,
        );
        setSelectedPlace(newPlace);
      } else {
        setSelectedPlace(null);
      }
    };

    updateSelectedPlaceOnNavigate();
  }, [searchParams.placeID, placesService]);

  const onPlaceSelect = (place: MapBoxPlace) => {
    setSelectedPlace(place);
    navigate({
      search: {
        ...searchParams,
        placeID: place.placeID,
      },
    }); // FIXME: include name, lat, lng?
  };

  const onPlaceUnselect = () => {
    setSelectedPlace(null);
    navigate({
      search: { ...searchParams, placeID: undefined },
    });
  };

  const computeDefaultCenter = () => {
    // FIXME: compute this based on trip, i.e. starting in NY, LA, etc...
    return { lat: 40.735, lng: -73.96 };
  };

  const renderMarkers = (
    places: MapBoxPlace[],
    variant: "favorite" | "stop",
  ) => {
    const selectedDate = searchParams.selectedDate;
    const placeIDsOnSelectedDate = new Set([
      ...events
        .filter((event) => event.start.includes(selectedDate || ""))
        .map(({ placeID }) => placeID),
    ]);

    return places
      .filter(({ placeID }) => {
        // only render favorite marker if no stop marker exists - don't render both!
        if (variant === "favorite") {
          return !stopPlaces.some((stop) => stop.placeID === placeID);
        }

        return true;
      })
      .map((place) => (
        <MapMarker
          key={`${variant} MapMarker: ${place.placeID}`}
          place={place}
          variant={variant}
          // if selectedDate exists, markers not on this date should be faded out
          isFaded={
            selectedDate !== undefined &&
            !placeIDsOnSelectedDate.has(place.placeID)
          }
          allowInfoWindow={selectedPlace?.placeID !== place.placeID}
          onClick={async () => {
            if (placesService) {
              const newPlace = await getPlaceByPlaceID(
                placesService,
                place.placeID,
              );
              onPlaceSelect(newPlace);
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
        maxZoom={18}
        restriction={{
          // don't allow users to scroll off the globe!
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
            // FIXME: render optimistically?
            isFavorited={favoritePlaces?.some(
              ({ placeID }) => placeID === selectedPlace.placeID,
            )}
            onFavorite={async () => {
              await createFavoriteForTrip(
                params.tripID,
                { placeID: selectedPlace.placeID },
                queryClient,
              );
            }}
            onUnfavorite={async () => {
              await deleteFavoriteForTrip(
                params.tripID,
                { placeID: selectedPlace.placeID },
                queryClient,
              );
            }}
          />
        )}

        {renderMarkers(favoritePlaces, "favorite")}
        {renderMarkers(stopPlaces, "stop")}
      </Map>
    </>
  );
}
