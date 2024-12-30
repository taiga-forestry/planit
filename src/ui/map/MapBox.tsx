import { useState, useEffect } from "react";
import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { PlaceQuerier } from "./PlaceQuerier";
import { MapBoxPlace } from "./types";
import { invariant, Link, useNavigate } from "@tanstack/react-router";

interface MapBoxProps {
  initialPlaceID: string | undefined;
}

interface MapBoxComponentProps {
  initialPlaceID: string | undefined;
}

export function MapBox({ initialPlaceID }: MapBoxProps) {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <MapBoxComponent initialPlaceID={initialPlaceID} />
    </APIProvider>
  );
}

function MapBoxComponent({ initialPlaceID }: MapBoxComponentProps) {
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const map = useMap();
  const places = useMapsLibrary("places");
  const [selectedPlace, setSelectedPlace] = useState<MapBoxPlace | null>(null);
  const [placeService, setPlaceService] =
    useState<google.maps.places.PlacesService | null>(null);

  // initialize the PlacesService on load
  useEffect(() => {
    if (places && map) {
      setPlaceService(new places.PlacesService(map));
    }
  }, [places, map]);

  // if given an initialPlaceID, find relevant info w/ the PlacesService
  useEffect(() => {
    if (initialPlaceID && placeService) {
      placeService.getDetails(
        {
          placeId: initialPlaceID,
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
            const id = initialPlaceID;
            const lat = place.geometry?.location?.lat();
            const lng = place.geometry?.location?.lng();
            const name = place.name;
            const address = place.formatted_address;
            const rating = place.rating;
            const numRatings = place.user_ratings_total;
            invariant(lat && lng, "place must have a latitude, longitude");

            setSelectedPlace({
              id,
              lat,
              lng,
              name,
              address,
              rating,
              numRatings,
            });
          }
        },
      );
    }
  }, [initialPlaceID, placeService]); // Effect runs only when initialPlaceID changes

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

  // when user selects a new place, adjust URL placeID search param
  const onPlaceSelect = (place: MapBoxPlace) => {
    navigate({ search: { placeID: place.id } }); // FIXME: include name, lat, lng?
    setSelectedPlace(place);
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
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      />
      {selectedPlace && (
        <AdvancedMarker
          position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
          clickable={true}
        >
          <div className="bg-white border border-black rounded-lg p-24 relative">
            <button
              className="top-6 right-6 z-50 absolute"
              onClick={() => setSelectedPlace(null)}
            >
              <Link to={window.location.pathname} className="text-16 z-20">
                X
              </Link>
            </button>
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
