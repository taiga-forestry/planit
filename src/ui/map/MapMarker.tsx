import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
// import { useState } from "react";

interface Props {
  lat: number;
  lng: number;
  onClick: () => void;
}

export function MapMarker({ lat, lng, onClick }: Props) {
  // const [isHovered, setIsHovered] = useState(false);
  // const colorsMap = {
  //   red: {
  //     background: "#FF0000", // Red color
  //     glyphColor: "#FFFFFF", // White for the pin's glyph (icon text)
  //   },
  //   green: {
  //     background: "#00FF00", // Green color
  //     glyphColor: "#FFFFFF", // White for the pin's glyph
  //   },
  //   blue: {
  //     background: "#0000FF", // Blue color
  //     glyphColor: "#FFFFFF", // White for the pin's glyph
  //   },
  //   yellow: {
  //     background: "#FFFF00", // Yellow color
  //     glyphColor: "#000000", // Black for the pin's glyph
  //   },
  // };

  return (
    <AdvancedMarker
      position={{ lat, lng }}
      onClick={onClick}
      className="hover:opacity-70 transition"
      // onMouseEnter={() => setIsHovered(true)}
      // onMouseLeave={() => setIsHovered(false)}
    >
      <Pin
      // background={isHovered ? colorsMap.red.background : null}
      // glyphColor={isHovered ? colorsMap.red.glyphColor : null}
      // glyph={<div> Hello </div>}
      />
    </AdvancedMarker>
  );
}
