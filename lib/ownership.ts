import type { DemoUser } from "./demoUsers";
import type { Applicant, Pet } from "./types";

/** Reviewers and administrators inspect all synthetic cases; a rehomer sees only their listings. */
export function visiblePets(user: DemoUser, pets: Pet[]) {
  return user.role === "rehomer" ? pets.filter(pet => pet.ownerId === user.id) : pets;
}

export function visibleApplications(user: DemoUser, applications: Applicant[], pets: Pet[]) {
  if (user.role !== "rehomer") return applications;
  const ownPetIds = new Set(visiblePets(user, pets).map(pet => pet.id));
  return applications.filter(application => ownPetIds.has(application.petId));
}

export function mayReviewPet(user: DemoUser, pet: Pet) {
  return user.role === "admin" || user.role === "reviewer" || (user.role === "rehomer" && pet.ownerId === user.id);
}
