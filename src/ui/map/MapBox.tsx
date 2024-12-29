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
import { Link, useNavigate } from "@tanstack/react-router";
import { googlePlacesKeyQueryPairs } from "../../api/google/queries";

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
  const map = useMap();
  const navigate = useNavigate({ from: "/trips/$tripID" });
  const [selectedPlace, setSelectedPlace] = useState<MapBoxPlace | null>(null);
  const {
    data: initialPlace,
    isLoading,
    error,
  } = useQuery({
    queryKey: googlePlacesKeyQueryPairs.getPlaceByPlaceID.key(
      initialPlaceID || "",
    ),
    queryFn: async () => {
      if (!initialPlaceID) {
        return null;
      }

      return await googlePlacesKeyQueryPairs.getPlaceByPlaceID.query(
        initialPlaceID,
      );
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

  const initialCenter = initialPlace
    ? { lat: initialPlace.lat, lng: initialPlace.lng }
    : { lat: 40.735, lng: -73.96 }; // FIXME: how to generate this default center?

  // when user selects a new place, adjust URL placeID search param
  const onPlaceSelect = (place: MapBoxPlace) => {
    navigate({ search: { placeID: place.id } }); // FIXME: include name, lat, lng?
    setSelectedPlace(place);
  };

  return (
    <>
      <PlaceQuerier map={map} onPlaceSelect={onPlaceSelect} />
      <Map
        mapId={import.meta.env.VITE_GOOGLE_MAPS_MAP_ID}
        style={{ width: "100%", height: "100%" }}
        defaultCenter={initialCenter}
        defaultZoom={initialPlace ? 17 : 13}
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
