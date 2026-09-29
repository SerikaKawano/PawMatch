import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import type { DemoUserId } from "./demoUsers";
import { mutateStore, readStore } from "./persistence";
import type { Pet } from "./types";

const requiredText = z.string().trim().min(1).max(2000);
export const petListingInput = z.object({
  name: z.string().trim().min(1).max(60), species: z.enum(["Dog", "Cat"]), breed: z.string().trim().min(1).max(100),
  sex: z.enum(["Female", "Male"]), birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), birthDateApproximate: z.boolean(),
  location: z.string().trim().min(1).max(100), temperament: z.string().trim().min(1).max(200), pedigree: requiredText,
  housing: requiredText, time: requiredText, care: requiredText, medical: requiredText, integration: requiredText, continuity: requiredText,
  medicalHistory: requiredText, medication: requiredText, vaccinations: requiredText, recordEvidence: requiredText,
  spayNeuter: requiredText, microchip: requiredText, evidenceStatus: z.enum(["確認済", "未確認"]),
  story: requiredText, conditionsMessage: requiredText, trial: requiredText, fees: requiredText,
}).strict();

const key = "pet-listings-v1";
const listingCharacters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const lines = (value: string) => value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

function listingNumber(reserved: Set<string>) {
  for (;;) {
    const bytes = randomBytes(8);
    const value = Array.from(bytes, byte => listingCharacters[byte % listingCharacters.length]).join("");
    if (!reserved.has(value)) return value;
  }
}

function ageAt(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  if (now.getUTCMonth() + 1 < month || now.getUTCMonth() + 1 === month && now.getUTCDate() < day) age--;
  return `${Math.max(0, age)}歳`;
}

export async function getPetListings() { return readStore<Pet[]>(key, () => []); }

export async function createPetListing(ownerId: DemoUserId, input: unknown, reservedNumbers: string[] = []) {
  const data = petListingInput.parse(input);
  return mutateStore<Pet[], Pet>(key, () => [], records => {
    const number = listingNumber(new Set([...reservedNumbers, ...records.map(record => record.listingNumber)]));
    const [year, month, day] = data.birthDate.split("-").map(Number);
    const pet: Pet = {
      id: `listing-${randomUUID()}`, ownerId, listedAt: new Date().toISOString(), listingNumber: number,
      name: data.name, species: data.species, breed: data.breed, age: ageAt(data.birthDate), sex: data.sex,
      birthDate: data.birthDateApproximate ? `${year}年${month}月頃` : `${year}年${month}月${day}日`,
      birthDateApproximate: data.birthDateApproximate, location: data.location,
      temperament: lines(data.temperament.replace(/、/g, "\n")), careNeeds: [data.care, data.medical], summary: data.conditionsMessage,
      emoji: data.species === "Dog" ? "🐕" : "🐈", accent: data.species === "Dog" ? "peach" : "sage", applications: 0,
      health: {
        medicalHistory: data.medicalHistory, medicalRecords: lines(data.recordEvidence), vaccinations: data.vaccinations,
        vaccinationHistory: lines(data.vaccinations), recordEvidence: lines(data.recordEvidence), medication: data.medication,
        spayNeuter: data.spayNeuter, microchip: data.microchip, evidenceStatus: data.evidenceStatus,
      },
      rehoming: {
        origin: data.story, pedigree: data.pedigree, houseTraining: data.housing, compatibility: data.integration,
        requirements: [data.housing, data.continuity], story: data.story, conditionsMessage: data.conditionsMessage,
        trial: data.trial, fees: data.fees,
        livingPoints: { housing: data.housing, time: data.time, care: data.care, medical: data.medical, integration: data.integration, continuity: data.continuity },
      },
    };
    records.push(pet);
    return pet;
  });
}
