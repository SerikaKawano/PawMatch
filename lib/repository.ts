import { connectDatabase, isDatabaseConfigured } from "./db";
import { applicants, pets } from "./seed";
import type { Applicant, Pet } from "./types";
import { ApplicationModel } from "@/models/Application";
import { PetModel } from "@/models/Pet";
import { getReviewRecords, initialReview, saveReview } from "./review-store";
import type { DemoUser } from "./demoUsers";
import { assess } from "./research/scoring";
import { getResearch } from "./research/store";

function withoutMongoFields<T>(record: Record<string, unknown>): T {
  const result = { ...record }; delete result._id; delete result.__v;
  return JSON.parse(JSON.stringify(result)) as T;
}
function mergeById<T extends {id:string}>(records:T[],seed:T[]):T[] {
  return [...records,...seed.filter(s=>!records.some(r=>r.id===s.id))];
}
export async function getPets(): Promise<Pet[]> {
  if (!isDatabaseConfigured()) return pets;
  await connectDatabase();
  const records = await PetModel.find({}).lean();
  return mergeById(records.map(record=>withoutMongoFields<Pet>(record)),pets).map(record => {
    const fixture = pets.find(pet => pet.id === record.id);
    return fixture ? { ...record, ownerId: fixture.ownerId, name: fixture.name, breed: fixture.breed, imageUrl: fixture.imageUrl, summary: fixture.summary, careNeeds: fixture.careNeeds, health: fixture.health, rehoming: fixture.rehoming } : record;
  });
}
export async function getApplicants(petId?: string): Promise<Applicant[]> {
  let base=applicants;
  if(isDatabaseConfigured()){
    await connectDatabase();
    const records=await ApplicationModel.find({}).lean();
    base=mergeById(records.map(record=>withoutMongoFields<Applicant>(record)),applicants);
  }
  const [reviews, research] = await Promise.all([getReviewRecords(), getResearch()]);
  return base.filter(app=>!petId||app.petId===petId).map(app=>{
    // Existing DB records are preserved; canonical synthetic evidence is attached when available.
    const fixture=applicants.find(a=>a.id===app.id);
    const review=reviews[app.id]??app.review??initialReview(app);
    const source=fixture?.researchCandidate??app.researchCandidate;
    if(!source)return {...app,stage:review.stage,verification:review.verification,review};
    const researchCandidate={...source,verification:review.verification};
    // Ordinary review uses the same active weights as the admin research settings.
    // Human decisions/history stay in review-store; only this displayed estimate changes.
    const assessment=assess(researchCandidate, research.config.weights);
    assessment.ruleVersion += `/config-v${research.config.version}`;
    return {...(fixture??app),stage:review.stage,verification:review.verification,researchCandidate,assessment,review,
      score:assessment.score,risks:assessment.risks,nextActions:assessment.nextActions.length?assessment.nextActions:["面談で具体的な計画と意思を確認する"]};
  });
}
export async function seedDatabase() {
  await connectDatabase();
  await Promise.all([
    PetModel.bulkWrite(pets.map(pet=>({updateOne:{filter:{id:pet.id},update:{$set:pet},upsert:true}}))),
    ApplicationModel.bulkWrite(applicants.map(app=>({updateOne:{filter:{id:app.id},update:{$set:app},upsert:true}}))),
  ]);
  return {pets:pets.length,applications:applicants.length};
}
export async function updateApplicationReview(id:string,input:unknown,actor:DemoUser) {
  const app=(await getApplicants()).find(a=>a.id===id);
  if(!app)return null;
  await saveReview(app,input,actor);
  return (await getApplicants()).find(a=>a.id===id)!;
}
