export type MapBoxPlace = {
  placeID: string;
  lat: number;
  lng: number;
  name: string | null | undefined;
  address: string | null | undefined;
  rating: number | null | undefined;
  numRatings: number | null | undefined;
};
