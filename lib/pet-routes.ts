import type { Pet } from "./types";

type RoutablePet = Pick<Pet, "id" | "listingNumber">;

export function petPath(pet: Pick<Pet, "listingNumber">) {
  return `/pets/${encodeURIComponent(pet.listingNumber)}`;
}

export function petConsultPath(pet: Pick<Pet, "listingNumber">) {
  return `${petPath(pet)}/consult`;
}

/**
 * Public routes use the listing number. The internal id remains accepted so
 * old bookmarks can be redirected without changing stored application data.
 */
export function findPetByRouteKey<T extends RoutablePet>(pets: T[], routeKey: string) {
  const decoded = decodeURIComponent(routeKey);
  return pets.find((pet) => pet.listingNumber.toUpperCase() === decoded.toUpperCase())
    ?? pets.find((pet) => pet.id === decoded);
}

export function isCanonicalPetRoute(pet: RoutablePet, routeKey: string) {
  return pet.listingNumber === decodeURIComponent(routeKey);
}
