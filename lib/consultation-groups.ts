import { consultationThread, type Consultation, type ConsultationStatus } from "./consultations";
import { linkedApplication } from "./consultation-journey";
import type { Applicant } from "./types";

export type ConsultationGroup = {
  key: string;
  userId: Consultation["userId"];
  petId: string;
  records: Consultation[];
  representative: Consultation;
  application: Applicant | null;
  status: ConsultationStatus;
  firstAt: string;
  latestAt: string;
};

const activityAt = (record: Consultation) => consultationThread(record).at(-1)?.createdAt ?? record.reviewedAt ?? record.createdAt;
const statusRank: Record<ConsultationStatus, number> = { closed: 0, received: 1, profile_requested: 2 };

export function groupConsultations(records: Consultation[], applications: Applicant[]): ConsultationGroup[] {
  const grouped = new Map<string, Consultation[]>();
  for (const record of records) {
    const key = `${record.userId}:${record.petId}`;
    grouped.set(key, [...(grouped.get(key) ?? []), record]);
  }
  return [...grouped.entries()].map(([key, items]) => {
    const ordered = [...items].sort((a, b) => activityAt(b).localeCompare(activityAt(a)));
    const linked = ordered.map(record => ({ record, application: linkedApplication(record, applications) })).filter(item => item.application);
    const representative = linked[0]?.record ?? [...ordered].sort((a, b) => {
      const rank = statusRank[b.status ?? "received"] - statusRank[a.status ?? "received"];
      return rank || activityAt(b).localeCompare(activityAt(a));
    })[0];
    const status = linked.length ? "profile_requested" : representative.status ?? "received";
    return {
      key, userId: representative.userId, petId: representative.petId, records: ordered, representative,
      application: linked[0]?.application ?? null, status,
      firstAt: [...ordered].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0].createdAt,
      latestAt: activityAt(ordered[0]),
    };
  }).sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}
