import { useRef, useState } from "react";
import {
  AdvancedMarker,
  InfoWindow,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { MapBoxPlace } from "./types";

interface Props {
  place: MapBoxPlace;
  variant: "favorite" | "stop";
  isFaded: boolean;
  allowInfoWindow: boolean;
  onClick: () => void;
}

// FIMXE: implement marker clustering?
export function MapMarker({
  place,
  variant,
  isFaded,
  allowInfoWindow,
  onClick,
}: Props) {
  const [marker, markerRef] = useAdvancedMarkerRef();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  return (
    <>
      <AdvancedMarker
        ref={marker}
        position={{ lat: place.lat, lng: place.lng }}
        onClick={onClick}
        className={`${isFaded ? "opacity-30 hover:opacity-20" : "hover:opacity-80"} transition`}
        onMouseEnter={() => {
          // only show InfoWindow if hovered for at least 0.3s
          hoverTimeout.current = setTimeout(() => {
            setIsHovered(true);
          }, 300);
        }}
        onMouseLeave={() => {
          // immediately hide InfoWindow on mouse leave
          if (hoverTimeout.current) {
            clearTimeout(hoverTimeout.current);
          }
          setIsHovered(false);
        }}
      >
        <div
          className={`map-marker w-32 h-32 ${variant === "favorite" ? "bg-red-500" : "bg-green-500"}`}
        >
          <i
            className={`map-marker-icon text-16 fas ${variant === "favorite" ? "fa-heart" : "fa-map-pin"}`}
          />
        </div>
      </AdvancedMarker>

      {isHovered && allowInfoWindow && (
        <InfoWindow anchor={markerRef}>
          <div className="p-20 font-sans l-column gap-4">
            <p className="text-16 font-bold max-w-[200px]">{place.name}</p>

            {place.rating && (
              <div className="row gap-3 items-center">
                {/* this is just a star picture */}
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

                <span className="text-12 whitespace-nowrap">
                  {place.rating} ({place.numRatings?.toLocaleString()})
                </span>
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
}
