import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Coordinates } from "@/types";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGoogleMapsUrl(location: { title: string; coordinates?: Coordinates }) {
  if (!location.coordinates) return '';
  const query = encodeURIComponent(location.title);
  const { lat, lng } = location.coordinates;
  return `https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${lat},${lng}`;
}