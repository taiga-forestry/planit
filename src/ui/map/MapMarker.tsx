import { useState } from "react";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

interface Props {
  lat: number;
  lng: number;
  variant: "favorite" | "stop";
  isFaded: boolean;
  onClick: () => void;
}

export function MapMarker({ lat, lng, variant, isFaded, onClick }: Props) {
  const [isHovered, setIsHovered] = useState(false);
  const colorsMap = {
    red: {
      hovered: {
        background: "rgba(255,0,0,0.8)", // Red color
        glyphColor: "rgba(250,250,250)", // White for the pin's glyph (icon text)
      },
      base: {
        background: "rgba(255,0,0)", // Red color
        glyphColor: "rgba(250,250,250)", // White for the pin's glyph (icon text)
      },
    },
    orange: {
      hovered: {
        background: "rgba(255,165,0,0.8)", // Orange color with 80% opacity
        glyphColor: "rgba(250,250,250)", // White for the pin's glyph (icon text)
      },
      base: {
        background: "rgba(255,165,0)", // Orange color
        glyphColor: "rgba(250,250,250)", // White for the pin's glyph (icon text)
      },
    },
  };

  const getBackgroundColor = () => {
    const color = variant === "favorite" ? colorsMap.orange : colorsMap.red;
    return isHovered ? color.hovered.background : color.base.background;
  };

  const getGlyphColor = () => {
    const color = variant === "favorite" ? colorsMap.orange : colorsMap.red;
    return isHovered ? color.hovered.glyphColor : color.base.glyphColor;
  };

  // const getGlyph = () => {
  //   const heart = document.createElement("i");
  //   heart.classList.add("fas");
  //   heart.classList.add("fa-heart");
  //   // fa-heart
  //   // beachFlagImg.src =
  //   //   "https://www.iconpacks.net/icons/1/free-heart-icon-992-thumb.png";
  //   // beachFlagImg.width = 20;
  //   // beachFlagImg.height = 20;

  //   return variant === "favorite" ? heart : heart;
  // };

  return (
    <AdvancedMarker
      position={{ lat, lng }}
      onClick={onClick}
      // className="hover:opacity-80 transition"
      className={isFaded ? "opacity-40" : ""}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Pin
        background={getBackgroundColor()}
        glyphColor={getGlyphColor()}
        // background={isHovered ? colorsMap.red.background : null}
        // glyphColor={isHovered ? colorsMap.red.glyphColor : null}
        // glyph={<div> Hello </div>}
        // glyph={getGlyph()}
      />
    </AdvancedMarker>
  );
}
