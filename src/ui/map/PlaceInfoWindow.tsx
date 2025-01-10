import {
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapBoxPlace } from "./types";

interface Props {
  place: MapBoxPlace;
  isSaveEnabled: boolean;
  onSave: () => void;
  onClose: () => void;
}

export function PlaceInfoWindow({
  place,
  isSaveEnabled,
  onSave,
  onClose,
}: Props) {
  const [marker, markerRef] = useAdvancedMarkerRef();

  return (
    <AdvancedMarker
      ref={marker}
      position={{ lat: place.lat, lng: place.lng }}
      clickable={true}
    >
      <InfoWindow anchor={markerRef} onClose={onClose}>
        <p className="text-16"> {place.name} </p>
        <p className="text-14 font-light"> {place.address} </p>

        {isSaveEnabled ? (
          <button className="text-14" onClick={onSave}>
            Add to favorites
          </button>
        ) : (
          <p> Saved! </p>
        )}

        {/* FIXME: include photo, link to maps, price? */}
        {/* <p> {selectedPlace?.price_level} </p> */}
      </InfoWindow>
    </AdvancedMarker>
  );
}
