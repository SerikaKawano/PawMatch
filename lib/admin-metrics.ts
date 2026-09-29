import type { Consultation } from "./consultations";
import { groupConsultations } from "./consultation-groups";
import type { Applicant, Pet } from "./types";

const dateKey = (value: Date) => value.toISOString().slice(0, 10);

export function annualAdminMetrics(pets: Pet[], consultations: Consultation[], applications: Applicant[], now = new Date()) {
  const periodEnd = new Date(now);
  const periodStart = new Date(now);
  periodStart.setUTCFullYear(periodStart.getUTCFullYear() - 1);
  const withinPeriod = (value?: string) => {
    if (!value) return false;
    const time = Date.parse(value.length === 10 ? `${value}T00:00:00.000Z` : value);
    return Number.isFinite(time) && time >= periodStart.getTime() && time <= periodEnd.getTime();
  };
  const personPetKey = (application: Applicant) => `${application.userId ?? application.name}:${application.petId}`;
  const reviewCases = new Set(applications.filter(application => withinPeriod(application.submittedAt)).map(personPetKey));
  const decisionCases = (decision: "decline" | "approve") => new Set(applications.filter(application => {
    if (!application.review?.decisionRecorded || application.review.decision !== decision) return false;
    return withinPeriod(application.review.history.at(-1)?.at);
  }).map(personPetKey)).size;
  const enquiryGroups = groupConsultations(consultations, applications).filter(group => group.records.some(record => withinPeriod(record.createdAt)));
  return {
    periodStart: dateKey(periodStart), periodEnd: dateKey(periodEnd),
    listedPets: pets.filter(pet => withinPeriod(pet.listedAt)).length,
    enquiries: enquiryGroups.length,
    reviews: reviewCases.size,
    declined: decisionCases("decline"),
    adopted: decisionCases("approve"),
  };
}

