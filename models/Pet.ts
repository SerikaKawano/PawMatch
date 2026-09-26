import { Schema, model, models } from "mongoose";

const PetSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    ownerId: { type: String, index: true },
    name: { type: String, required: true },
    species: { type: String, enum: ["Dog", "Cat"], required: true },
    breed: String,
    age: String,
    sex: String,
    location: String,
    temperament: [String],
    careNeeds: [String],
    summary: String,
    emoji: String,
    imageUrl: String,
    accent: String,
    applications: Number,
    urgent: Boolean,
    health: {
      medicalHistory: String,
      medicalRecords: [String],
      vaccinations: String,
      medication: String,
      spayNeuter: String,
      microchip: String,
      evidenceStatus: String,
    },
    rehoming: {
      origin: String,
      pedigree: String,
      houseTraining: String,
      compatibility: String,
      requirements: [String],
      trial: String,
      fees: String,
    },
  },
  { timestamps: true },
);

export const PetModel = models.Pet ?? model("Pet", PetSchema);
