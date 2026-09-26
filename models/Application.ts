import { Schema, model, models } from "mongoose";

const RiskSchema = new Schema({ severity: String, label: String, detail: String }, { _id: false });
const VerificationSchema = new Schema(
  { identity: String, housing: String, cohabitantConsent: String, lifelongCare: String, followUp: String },
  { _id: false },
);

const ApplicationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    petId: { type: String, required: true, index: true },
    name: String,
    submittedAt: String,
    household: String,
    housing: String,
    experience: String,
    availability: String,
    existingPets: String,
    veterinaryAccess: String,
    financialReadiness: String,
    score: Number,
    strengths: [String],
    risks: [RiskSchema],
    nextActions: [String],
    verification: VerificationSchema,
    stage: String,
  },
  { timestamps: true },
);

export const ApplicationModel = models.Application ?? model("Application", ApplicationSchema);
