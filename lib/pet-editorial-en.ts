import { petEditorial } from "./pet-editorial";
import { petProfiles } from "./pet-profiles";

type CaseEnglish = {
  story: string;
  conditions: string;
  living: [string, string, string, string, string, string];
  pedigree: string;
  trial: string;
  fees: string;
  vaccines: string[];
  evidence: string[];
  medical: string;
  records: string[];
  medication: string;
  neutering: string;
};

const cases: Record<string, CaseEnglish> = {
  momo: {
    story: "Bella has lived with a family since she was a kitten. Her owner now needs a long hospital stay, and the family can no longer manage her medication and appointments. She can bring her familiar blanket to her new home.",
    conditions: "Bella's kidney condition is stable, but she needs morning and evening medication and a daily food log. Please introduce her to one quiet room first. We would like to discuss how to transfer her veterinary care.",
    living: [
      "A pet-friendly home with indoor-only care, secure windows and doors, and a quiet room where she can rest.",
      "Medication and food at regular times morning and evening; check appetite and water intake daily. Someone else must be able to give medicine when you are away.",
      "An older cat may eat less after a move. Let her settle at her own pace and record food intake and toileting without forcing handling.",
      "Chronic kidney disease requires monitoring. Plan for blood and urine tests about every three months, medicine, prescription food and urgent veterinary costs.",
      "Everyone at home must agree to medication and a quiet space. Supervise children; introduce any resident cat gradually from a separate room.",
      "Plan for lifelong care and a carer during illness or a move. Please share updates one and three months after adoption.",
    ],
    pedigree: "No pedigree certificate (domestic cat)", trial: "Usually two weeks; we will go through medication together on day one.", fees: "Actual travel costs only, agreed in advance.",
    vaccines: ["June 2015: first feline core vaccination (about 8 weeks old)", "July 2015: second feline core dose", "2016–2024: annual autumn feline core vaccinations, recorded in the vaccination booklet", "November 2025: feline core vaccination; discuss the next dose with the vet"],
    evidence: ["November 2025 vaccination booklet: copy submitted, awaiting review", "July 2026 blood-test results: copy submitted, awaiting review", "August 2026 urine-test results: not yet submitted; to be shared before the meeting", "Neutering and microchip: registration copies submitted"],
    medical: "Chronic kidney disease under monitoring (rehomer report). Appetite and water intake are logged daily.", records: ["July 2026: routine blood test and weight check (3.8 kg)", "August 2026: urine test and diet review"], medication: "One prescribed medicine morning and evening; details shared at the meeting.", neutering: "Spayed (2020)",
  },
  yuki: {
    story: "Snow was found in a residential area four years ago. Her temporary carer is moving to a property that does not allow pets. She is comfortable with people but may eat less immediately after a move.",
    conditions: "She may hide for a few days. Please give her a quiet room and familiar food rather than rushing contact. We would also like to discuss measures to prevent her escaping through the front door.",
    living: [
      "An indoor-only, pet-friendly home with a quiet room for the first two weeks and secure windows and entrance doors.",
      "Feed morning and evening and check the litter tray. Check appetite during the day after the move; arrange for someone to visit if you are out for a long time.",
      "Snow is friendly but sensitive to new sounds. Do not punish hiding; expand her space at her own pace.",
      "No major issues were found at the May 2026 check-up. Plan for a vet if she does not eat, plus regular check-ups and vaccination costs.",
      "Everyone at home should agree. Teach children not to chase her and begin introductions to other pets with scent swapping.",
      "Plan for lifelong care and a carer during travel or a move. Please share appetite and settling-in updates for the first month.",
    ],
    pedigree: "No certificate; parentage before rescue is unknown.", trial: "About two weeks, reviewing food intake and settling in together.", fees: "Actual travel costs only, agreed once the journey is planned.",
    vaccines: ["Before rescue: vaccination history unknown", "July 2022: first feline core vaccination after rescue", "August 2022: second feline core dose", "August 2023, August 2024 and August 2025: feline core vaccinations", "April 2026: feline core vaccination; interval to be checked with the vet"],
    evidence: ["April 2026 vaccination booklet: copy submitted and checked", "May 2026 health check and faecal test: copies submitted and checked", "Neutering and microchip: registration copies submitted and checked", "Pre-rescue vaccination record: unavailable"],
    medical: "No major findings at the May 2026 health check (rehomer report). Her appetite may fall after a change of environment.", records: ["May 2026: general check-up and weight (4.2 kg)", "May 2026: faecal test"], medication: "No ongoing medication", neutering: "Neutered (2023)",
  },
  sora: {
    story: "Finn was surrendered when he was young and now lives with a rescue foster family. Daily walks and short training sessions have helped him settle. He loves to play and is affectionate with people he knows.",
    conditions: "He is energetic, so we hope to meet someone who can make morning and evening walks part of daily life. He can become excited on first meeting; we would like the whole family to meet him calmly.",
    living: [
      "A home permitted to keep a medium-sized dog, with an indoor resting space and barriers at the garden and front door. He should not be tied up outside.",
      "Allow about 30–40 minutes of walking morning and evening, plus a short training session. He currently manages about four hours alone; longer absences need another walker.",
      "He may jump up when excited. Continue reward-based calm behaviour practice and allow time for progress.",
      "No major past conditions are known. Budget for yearly checks and vaccines, paw care and treatment for injuries; identify a local vet.",
      "Everyone at home should agree. Adults should supervise play with young children; introduce resident dogs outdoors in short sessions.",
      "Plan for lifelong care and someone who can walk him if work or health changes. Please provide updates after adoption.",
    ],
    pedigree: "No certificate; mixed-breed parents unknown.", trial: "Two to three weeks to assess walks and settling at home.", fees: "¥12,000 in rescue medical costs, plus actual travel; itemised medical expenses shared in advance.",
    vaccines: ["Before rescue: vaccination history unknown", "August 2024: first canine core vaccination", "September 2024: second canine core dose", "April 2025: rabies; August 2025: canine core vaccination", "April 2026: canine core vaccination; May 2026: rabies"],
    evidence: ["April 2026 canine vaccination certificate: copy submitted and checked", "May 2026 rabies certificate: copy submitted and checked", "March 2026 check-up and June 2026 faecal test: copies submitted and checked", "Pre-rescue treatment and vaccine records: unavailable"],
    medical: "No major known conditions. His paws and pads are checked daily because he is active (rehomer report).", records: ["March 2026: check-up and weight (13.6 kg)", "June 2026: faecal test"], medication: "No ongoing medication", neutering: "Spayed (2025)",
  },
  kai: {
    story: "Leo has lived indoors with his family. A move prompted by family care needs means his owner can no longer keep a large dog. He enjoys resting near people, and his meals are measured because he gains weight easily.",
    conditions: "Please check your housing rules for large dogs before enquiring. Consistent daily walks matter more than long or fast exercise. We can send his familiar bed with him.",
    living: [
      "A home whose rules allow large dogs. Provide non-slip indoor flooring and secure garden and entrance gates; outdoor-only keeping is unsuitable.",
      "Allow two gentle 25–30 minute walks each day and measured meals. He has stayed alone for about five hours; longer absences need family care.",
      "Agree on treat portions across the household. Allow several weeks for him to adjust to a new home.",
      "Monitor weight and joint comfort. His July 2026 weight was 30.6 kg. Identify a vet and budget for yearly checks and large-dog care.",
      "Everyone at home should agree to a large dog. Supervise play with children and meet resident animals gradually in open space.",
      "Plan for lifelong care, including transport and appointments in old age. Identify emergency help and share updates after adoption.",
    ],
    pedigree: "No certificate; breed is based on appearance and rehomer report.", trial: "Two weeks, checking travel stress and compatibility with resident pets.", fees: "Actual travel costs only; estimate shared in advance.",
    vaccines: ["April 2020: first canine core vaccination; May 2020: second dose", "June 2020: rabies vaccination", "2021–2025: canine core and rabies vaccinations each spring", "March 2026: canine core vaccination; April 2026: rabies"],
    evidence: ["March 2026 canine vaccination certificate: copy submitted and checked", "April 2026 rabies certificate: copy submitted and checked", "February and July 2026 weight records: veterinary copies submitted and checked", "Neutering and microchip: certificate copies submitted and checked"],
    medical: "He gains weight easily, so food portions and pressure on his joints are monitored (rehomer report).", records: ["February 2026: health check, 31.2 kg", "July 2026: weight check, 30.6 kg"], medication: "No ongoing medication", neutering: "Neutered (2022)",
  },
  hana: {
    story: "Luna was rescued as a kitten and lived comfortably in foster care. After another cat joined the foster home, she became tense at mealtimes. We are looking for a home where she can feel secure as an only cat.",
    conditions: "Please prepare a room and food bowl just for Luna at first. If you already have a cat, we would like you to start with scent swapping rather than an immediate face-to-face meeting.",
    living: [
      "An indoor-only, pet-friendly home with a separate room, secure doors and windows, and a quiet eating area.",
      "Feed and check toileting separately morning and evening. Monitor appetite during the day at first and arrange a carer for long absences.",
      "Her caution around other cats is part of her temperament. Provide hiding places and allow weeks, not days, for introductions.",
      "No major past conditions are known. Identify a vet if appetite falls and budget for checks, vaccines and separate feeding.",
      "Everyone at home should agree. Children must respect hiding spaces; introduce resident cats gradually from separate rooms.",
      "Plan for lifelong care, including separate management during a move or emergency. Please report appetite and relationships after adoption.",
    ],
    pedigree: "No certificate; parents before rescue are unknown.", trial: "About two weeks, with a possible extension if there is a resident cat.", fees: "¥9,000 for rescue neutering and tests; itemised costs shared in advance.",
    vaccines: ["Before rescue: vaccination history unknown", "September 2021: first feline core vaccination; October 2021: second dose", "February 2022–2025: annual feline core vaccination", "February 2026: feline core vaccination"],
    evidence: ["February 2026 vaccination booklet: copy submitted and checked", "January 2026 health check and June 2026 faecal test: copies submitted and checked", "Neutering and microchip: registration copies submitted and checked", "Pre-rescue treatment and vaccine records: unavailable"],
    medical: "No major known conditions. Food intake sometimes drops after a move; appetite is monitored (rehomer report).", records: ["January 2026: general health check, 3.6 kg", "June 2026: faecal test"], medication: "No ongoing medication", neutering: "Spayed (2022)",
  },
  riku: {
    story: "Oreo has always lived with one owner. An overseas work placement and unsuitable housing mean his owner must find him a new home. He enjoys sleeping in a sunny window.",
    conditions: "He does not enjoy being held. If you sit nearby quietly, he will approach on his own. We hope to find someone who enjoys sharing a calm home with him.",
    living: [
      "An indoor-only, pet-friendly home with secure doors and windows, high perches and a quiet hiding place.",
      "Feed morning and evening and play for around 15 minutes daily. He has stayed alone for about six hours; arrange a carer for travel.",
      "When loud sounds or handling upset him, give him space. Let him initiate contact rather than rushing affection.",
      "Tartar builds up easily; continue oral checks. Find a vet who can advise on dental care and budget for checks and vaccines.",
      "Explain his need for quiet to everyone at home. Supervise children and introduce any resident pet cautiously from a separate room.",
      "Plan for lifelong care and a carer during illness or a move. Please share updates while he settles in.",
    ],
    pedigree: "No certificate (domestic cat).", trial: "Two weeks in a quiet space to assess how he settles.", fees: "Actual travel costs only, agreed in advance.",
    vaccines: ["May 2018: first feline core vaccination; June 2018: second dose", "Winter 2019–2024: annual feline core vaccinations", "December 2025: feline core vaccination", "2026: timing of the next dose to be discussed with his vet"],
    evidence: ["December 2025 vaccination booklet: copy submitted and checked", "March 2026 check-up and oral examination: veterinary receipt submitted and checked", "Neutering and microchip: registration copies submitted and checked", "Past dental treatment: none reported"],
    medical: "He develops tartar easily and has regular oral checks (rehomer report).", records: ["March 2026: check-up, 4.5 kg", "March 2026: oral examination"], medication: "No ongoing medication", neutering: "Neutered (2019)",
  },
  haru: {
    story: "Daisy was rescued several years ago and now lives with a foster family. Her carer's health has changed and they can no longer help her on stairs. We are looking for a home with fewer steps. She likes napping near people.",
    conditions: "Her back legs are stiff on some days, so she needs someone able to help her move. Short, comfortable walks are better than strenuous exercise. We will hand over her medicine and veterinary information.",
    living: [
      "A home permitted to keep a small dog, with non-slip indoor flooring, fewer steps and secure doors and balconies. Outdoor-only care is unsuitable.",
      "Two short 15–20 minute walks and one dose of medicine daily. Check her gait every day; long absences require another carer.",
      "Her mobility varies. Do not force a walk on a painful day; allow gentle adjustment appropriate to her age.",
      "Joint monitoring and medication continue. Identify a vet and plan for visits, medicine and urgent treatment if pain increases.",
      "Everyone at home should understand her condition. Adults should support children lifting her; meet resident pets in short sessions.",
      "Plan for lifelong senior care and an emergency helper for transport and veterinary visits. Please share mobility updates after adoption.",
    ],
    pedigree: "No certificate; breed is estimated from appearance.", trial: "Two weeks to assess walking and indoor comfort.", fees: "¥7,500 for post-rescue tests plus actual travel; veterinary receipts shared in advance.",
    vaccines: ["Before rescue: vaccination history unknown", "September 2019: first canine core vaccination after rescue; October 2019: second dose", "Spring 2020–2025: annual canine core and rabies vaccinations", "March 2026: canine core vaccination; April 2026: rabies"],
    evidence: ["March 2026 canine vaccination certificate: copy submitted, awaiting review", "April 2026 rabies certificate: copy submitted, awaiting review", "February and August 2026 joint-examination records: August record awaiting review", "Neutering and microchip: registration copies submitted"],
    medical: "Stiffness in her hind legs is monitored (rehomer report).", records: ["February 2026: orthopaedic visit and gait check", "August 2026: routine visit and weight (7.1 kg)"], medication: "Joint-care medicine once daily; prescription details shared at the meeting.", neutering: "Spayed (2020)",
  },
  nagi: {
    story: "Mocha has lived with a family, but a work transfer has left them with too little time together. He loves his morning walk and settles quietly near his people when they come home.",
    conditions: "He may be a little nervous in a new place. We would like to speak with someone who can keep his familiar walking routine and enjoy brushing him while checking his skin.",
    living: [
      "A home permitted to keep a small dog, with an indoor bed and secure entrance, balcony and garden boundaries.",
      "About 20 minutes of walking morning and evening, regular meals and brushing several times a week. He manages about five hours alone; arrange care for longer days.",
      "He may bark at first after a move. Build up time alone gradually and reward calm behaviour.",
      "Monitor dry skin. Identify a vet and budget for annual checks, vaccinations and treatment if skin symptoms worsen.",
      "Everyone at home should agree to walking and grooming. Supervise children and introduce resident dogs gradually on walks.",
      "Plan for lifelong care and a carer during relocation or illness. Please share updates after adoption.",
    ],
    pedigree: "No certificate; breed is based on rehomer report.", trial: "About two weeks, checking time alone and daily care.", fees: "Actual travel costs only; estimate shared before travel.",
    vaccines: ["March 2021: first canine core vaccination; April 2021: second dose", "May 2021: rabies vaccination", "Spring 2022–2025: annual canine core and rabies vaccinations", "April 2026: canine core vaccination; May 2026: rabies"],
    evidence: ["April 2026 canine vaccination certificate: copy submitted and checked", "May 2026 rabies certificate: copy submitted and checked", "April 2026 health check and July 2026 skin check: veterinary receipts submitted and checked", "Neutering and microchip: registration copies submitted and checked"],
    medical: "No major known conditions. Dry skin is checked while brushing (rehomer report).", records: ["April 2026: check-up, 4.3 kg", "July 2026: skin and coat check"], medication: "No ongoing medication", neutering: "Neutered (2023)",
  },
};

export const petCaseTranslations: Record<string, string> = {};
for (const [id, translated] of Object.entries(cases)) {
  const japanese = petEditorial[id];
  const profile = petProfiles[id];
  petCaseTranslations[japanese.story] = translated.story;
  petCaseTranslations[japanese.conditionsMessage] = translated.conditions;
  petCaseTranslations[japanese.pedigree] = translated.pedigree;
  petCaseTranslations[japanese.trial] = translated.trial;
  petCaseTranslations[japanese.fees] = translated.fees;
  for (const [index, key] of (["housing", "time", "care", "medical", "integration", "continuity"] as const).entries()) {
    petCaseTranslations[japanese.livingPoints[key]] = translated.living[index];
  }
  japanese.vaccinationHistory.forEach((item, index) => { petCaseTranslations[item] = translated.vaccines[index]; });
  japanese.recordEvidence.forEach((item, index) => { petCaseTranslations[item] = translated.evidence[index]; });
  if (profile.health) {
    petCaseTranslations[profile.health.medicalHistory] = translated.medical;
    petCaseTranslations[profile.health.medication] = translated.medication;
    petCaseTranslations[profile.health.spayNeuter] = translated.neutering;
    profile.health.medicalRecords.forEach((item, index) => { petCaseTranslations[item] = translated.records[index]; });
  }
}
