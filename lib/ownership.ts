import type { DemoUser } from "./demoUsers";
import type { Applicant, Pet } from "./types";

/** Service staff inspect all synthetic cases; other users see only cases they participate in. */
export function visiblePets(user: DemoUser, pets: Pet[]) {
  return user.role === "rehomer" ? pets.filter(pet => pet.ownerId === user.id) : pets;
}

export function visibleApplications(user: DemoUser, applications: Applicant[], pets: Pet[]) {
  if (user.role === "admin" || user.role === "reviewer") return applications;
  if (user.role === "adopter") return applications.filter(application => application.userId === user.id);
  const ownPetIds = new Set(pets.filter(pet => pet.ownerId === user.id).map(pet => pet.id));
  return applications.filter(application => ownPetIds.has(application.petId));
}

export function mayReviewPet(user: DemoUser, pet: Pet) {
  return user.role === "admin" || user.role === "reviewer" || (user.role === "rehomer" && pet.ownerId === user.id);
}
