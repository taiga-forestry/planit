import {
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapBoxPlace } from "./types";
import "./styles.css";

interface Props {
  place: MapBoxPlace;
  isFavorited: boolean;
  onFavorite: () => void;
  onUnfavorite: () => void;
  onClose: () => void;
}

export function PlaceInfoWindow({
  place,
  isFavorited,
  onFavorite,
  onUnfavorite,
  onClose,
}: Props) {
  const [marker, markerRef] = useAdvancedMarkerRef();

  // FIXME: include photo, link to maps, price, tags?
  // FIXME - try sideways infowindow?
  return (
    <AdvancedMarker
      ref={marker}
      position={{ lat: place.lat, lng: place.lng }}
      clickable={true}
    >
      <InfoWindow anchor={markerRef} onClose={onClose} className=" w-[360px]">
        {/* <div className="bg-white rounded border border-black relative z-50"> */}
        {/* FIXME - making network call for each photo? add spinner? */}
        <img
          src={place.photoURL}
          className="w-[360px] h-[240px] object-cover"
          // alt="Hello" // FIXME: loading latency
          loading="lazy"
        />

        <button className="absolute top-0 right-0 bg-white bg-opacity-0 w-48 h-48 rounded-[48px]">
          <i
            className="text-24 p-12 fas fa-times hover:opacity-50 transition"
            onClick={onClose}
          />
        </button>

        <div className="p-20 font-sans">
          <p className="text-18 font-bold max-w-[200px]"> {place.name} </p>

          {place.rating && (
            <div className="row gap-3 items-center">
              {/* this is just a star picture - FIXME: refactor into /ui? */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                focusable="false"
                width={11}
                height={11}
                className="block"
              >
                <path d="m15.1 1.58-4.13 8.88-9.86 1.27a1 1 0 0 0-.54 1.74l7.3 6.57-1.97 9.85a1 1 0 0 0 1.48 1.06l8.62-5 8.63 5a1 1 0 0 0 1.48-1.06l-1.97-9.85 7.3-6.57a1 1 0 0 0-.55-1.73l-9.86-1.28-4.12-8.88a1 1 0 0 0-1.82 0z" />
              </svg>

              <span className="text-14 whitespace-nowrap">
                {place.rating} ({place.numRatings?.toLocaleString()})
              </span>
            </div>
          )}

          <div className="mt-40 row justify-between items-center">
            <p className="text-12"> {place.address} </p>
            <button
              className="text-24"
              onClick={async () => {
                if (isFavorited) {
                  onUnfavorite();
                } else {
                  // FIXME: occasional bug where it lags, and spams network calls?
                  onFavorite();
                }
              }}
            >
              {/* FIXME -- render optimistically? */}
              <i
                className={`${isFavorited ? "fas" : "far"} fa-heart hover:opacity-50 transition`}
                style={{
                  color: isFavorited ? "red" : "black",
                }}
              />
            </button>
          </div>
        </div>
      </InfoWindow>
    </AdvancedMarker>
  );
}
