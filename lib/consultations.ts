import { randomUUID } from "node:crypto";
import { z } from "zod";
import { mutateStore, readStore } from "./persistence";
import type { DemoUserId } from "./demoUsers";

export const consultationInput = z.object({
  petId: z.string().regex(/^[a-zA-Z0-9-]+$/).max(80),
  message: z.string().trim().min(1, "相談内容を入力してください。").max(2000),
  // Keep the persisted key for existing consultations; it now accepts either contact method.
  contactEmail: z.string().trim().max(254).refine(value => {
    if (z.string().email().safeParse(value).success) return true;
    const digits = value.replace(/\D/g, "");
    return /^\+?[0-9][0-9\s()-]*$/.test(value) && digits.length >= 10 && digits.length <= 15;
  }, "メールアドレスまたは電話番号を入力してください。"),
  requestId: z.string().uuid(),
});

export const consultationMessageInput = z.object({
  message: z.string().trim().min(1, "メッセージを入力してください。").max(2000),
});

export type ConsultationStatus = "received" | "profile_requested" | "closed";
export type ConsultationMessage = {
  id: string;
  authorId: DemoUserId;
  body: string;
  createdAt: string;
};
export type Consultation = z.infer<typeof consultationInput> & {
  id: string;
  userId: DemoUserId;
  createdAt: string;
  topic?: string;
  status?: ConsultationStatus;
  reviewedAt?: string;
  reviewedBy?: DemoUserId;
  replyMessage?: string;
  messages?: ConsultationMessage[];
};

export const consultationReply = (status: Exclude<ConsultationStatus, "received">) => status === "closed"
  ? "ご相談ありがとうございました。今回は相談段階で終了し、審査には進んでいません。"
  : "ご相談を確認しました。プロファイルと必要な情報をご提出ください。内容を確認して審査の手続きへ進みます。";

export function consultationThread(consultation: Consultation): ConsultationMessage[] {
  const initial: ConsultationMessage = {
    id: `${consultation.id}-initial`, authorId: consultation.userId,
    body: consultation.message, createdAt: consultation.createdAt,
  };
  if (consultation.messages) return [initial, ...consultation.messages].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  if (!consultation.replyMessage || !consultation.reviewedAt) return [initial];
  return [initial, {
    id: `${consultation.id}-reply`, authorId: consultation.reviewedBy ?? "reviewer",
    body: consultation.replyMessage, createdAt: consultation.reviewedAt,
  }];
}

const key = "consultations-v1";
type FollowUp = Omit<ConsultationMessage, "id">;
type SampleRow = {
  userId: DemoUserId; petId: string; status: ConsultationStatus; createdAt: string;
  reviewedAt?: string; message: string; messages: FollowUp[];
};
const reviewerRequest = "お問い合わせありがとうございます。審査を希望される場合は、基本プロファイルと詳細プロファイルをご提出ください。";
const profileSubmitted = "基本プロファイルと詳細プロファイルを提出しました。追加で必要な情報があればお知らせください。";
const followUp = (authorId: DemoUserId, createdAt: string, body: string): FollowUp => ({ authorId, createdAt, body });

const sampleRows: SampleRow[] = [
  {
    userId: "adopter", petId: "momo", status: "profile_requested", createdAt: "2026-09-01T09:00:00.000Z", reviewedAt: "2026-09-02T10:30:00.000Z",
    message: "朝夕の投薬は何時頃が目安でしょうか。平日の通院頻度についても詳しく伺いたいです。",
    messages: [
      followUp("rehomer", "2026-09-01T14:20:00.000Z", "投薬は朝7時頃と夜19時頃が目安です。通院は現在3か月ごとですが、体調により追加受診があります。"),
      followUp("adopter", "2026-09-01T18:40:00.000Z", "平日も家族と分担して対応できます。かかりつけ候補の病院と移動手段をプロファイルに記載します。"),
      followUp("reviewer", "2026-09-02T10:30:00.000Z", reviewerRequest),
      followUp("adopter", "2026-09-02T18:10:00.000Z", profileSubmitted),
      followUp("reviewer", "2026-09-03T10:00:00.000Z", "提出内容を受領し、申込みを受け付けました。現在は適合性確認を進めています。"),
    ],
  },
  {
    userId: "adopter-olivia", petId: "yuki", status: "profile_requested", createdAt: "2026-09-04T09:15:00.000Z", reviewedAt: "2026-09-05T11:00:00.000Z",
    message: "来客が少ない静かな家です。最初の数週間に用意すべき隠れ場所や生活スペースを教えてください。",
    messages: [
      followUp("rehomer", "2026-09-04T15:40:00.000Z", "最初は扉を閉められる一室に、隠れられる箱、トイレ、食器を離して置くことを勧めています。"),
      followUp("adopter-olivia", "2026-09-05T08:20:00.000Z", "寝室横の個室を最初の生活スペースにできます。窓の脱走防止柵も設置予定です。"),
      followUp("reviewer", "2026-09-05T11:00:00.000Z", reviewerRequest),
      followUp("adopter-olivia", "2026-09-06T17:30:00.000Z", "飼育許可書と住居の間取りを含めてプロファイルを提出しました。"),
      followUp("reviewer", "2026-09-08T09:45:00.000Z", "提出書類を受領しました。現在は書類確認を進めています。追加資料が必要な場合はこの履歴でご連絡します。"),
    ],
  },
  {
    userId: "adopter-amelia", petId: "sora", status: "profile_requested", createdAt: "2026-09-04T13:10:00.000Z", reviewedAt: "2026-09-05T13:40:00.000Z",
    message: "平日は朝夕各40分ほど散歩できます。面談は土曜日を希望していますが、候補日はありますか。",
    messages: [
      followUp("rehomer", "2026-09-04T17:20:00.000Z", "散歩計画をありがとうございます。Soraは朝夕に十分な運動が必要です。面談候補日はPawMatch運営の確認後に一緒に調整します。"),
      followUp("adopter-amelia", "2026-09-05T09:00:00.000Z", profileSubmitted),
      followUp("reviewer", "2026-09-05T13:40:00.000Z", "書類確認まで完了したため、9月19日または20日の面談を調整できます。"),
      followUp("adopter-amelia", "2026-09-06T10:15:00.000Z", "9月20日の午前を希望します。同居する家族も参加できます。"),
    ],
  },
  {
    userId: "adopter-ethan", petId: "kai", status: "profile_requested", createdAt: "2026-09-08T10:30:00.000Z", reviewedAt: "2026-09-09T15:20:00.000Z",
    message: "先住犬との相性を確かめる際、最初の対面はどのように行うのが安全でしょうか。",
    messages: [
      followUp("rehomer", "2026-09-08T16:00:00.000Z", "最初は中立な屋外で距離を保ち、二人でそれぞれの犬を担当する方法を予定しています。"),
      followUp("adopter-ethan", "2026-09-09T08:45:00.000Z", "先住犬は避妊済みで、混合ワクチンも接種済みです。証明書を提出できます。"),
      followUp("reviewer-alex", "2026-09-09T15:20:00.000Z", reviewerRequest),
      followUp("adopter-ethan", "2026-09-10T18:10:00.000Z", profileSubmitted),
      followUp("reviewer-alex", "2026-09-11T14:00:00.000Z", "申込みを受け付けました。先住犬との段階的な導入計画について、現在追加確認を行っています。"),
    ],
  },
  {
    userId: "adopter-grace", petId: "hana", status: "profile_requested", createdAt: "2026-09-12T09:40:00.000Z", reviewedAt: "2026-09-13T12:00:00.000Z",
    message: "賃貸住宅の飼育規約は、どのページを提出すればよいでしょうか。管理会社の承諾書も必要ですか。",
    messages: [
      followUp("reviewer", "2026-09-12T14:15:00.000Z", "動物の種類と頭数が確認できる規約ページをご提出ください。規約だけで判断できない場合は管理会社の承諾書もお願いします。"),
      followUp("adopter-grace", "2026-09-12T19:30:00.000Z", "猫1頭まで可と記載された規約と、管理会社からのメールを用意できます。"),
      followUp("reviewer", "2026-09-13T12:00:00.000Z", reviewerRequest),
      followUp("adopter-grace", "2026-09-14T16:30:00.000Z", "プロファイルと住居規約を提出しました。管理会社のメールも補足資料として登録しています。"),
      followUp("reviewer", "2026-09-15T11:20:00.000Z", "申込みを受け付け、書類確認を進めています。住居条件は確認済みです。"),
    ],
  },
  {
    userId: "adopter-oliver", petId: "riku", status: "profile_requested", createdAt: "2026-09-13T11:20:00.000Z", reviewedAt: "2026-09-14T10:00:00.000Z",
    message: "トライアル中に食欲が落ちた場合の連絡先と、受診の判断基準を事前に確認したいです。",
    messages: [
      followUp("rehomer-riku", "2026-09-13T16:45:00.000Z", "食事を2回続けて取らない、嘔吐が続く、排尿がない場合はすぐに私へ連絡し、指定病院へ相談してください。"),
      followUp("adopter-oliver", "2026-09-14T08:20:00.000Z", "自宅から指定病院まで車で15分です。夜間病院の連絡先も登録します。"),
      followUp("reviewer-alex", "2026-09-14T10:00:00.000Z", reviewerRequest),
      followUp("adopter-oliver", "2026-09-15T17:00:00.000Z", profileSubmitted),
      followUp("reviewer-alex", "2026-09-22T18:30:00.000Z", "面談内容を双方で確認しました。現在はトライアル中です。毎日の食事量と排泄、体調を記録してください。"),
    ],
  },
  {
    userId: "adopter-ava", petId: "nagi", status: "profile_requested", createdAt: "2026-09-18T09:00:00.000Z", reviewedAt: "2026-09-19T10:10:00.000Z",
    message: "初めて犬を迎えます。留守番の練習と、最初に揃えるものについて相談したいです。",
    messages: [
      followUp("rehomer-nagi", "2026-09-18T15:30:00.000Z", "短時間から留守番を練習し、落ち着ける寝床、滑りにくい床材、脱走防止ゲートを準備してください。"),
      followUp("adopter-ava", "2026-09-19T08:40:00.000Z", "準備できる環境を確認しました。審査を希望するため、必要な情報を教えてください。"),
      followUp("reviewer", "2026-09-19T10:10:00.000Z", reviewerRequest),
      followUp("adopter-ava", "2026-09-20T18:00:00.000Z", "現在プロファイルと住居の資料を準備しています。提出まで数日お待ちください。"),
    ],
  },
  {
    userId: "adopter-liam", petId: "momo", status: "closed", createdAt: "2026-09-22T10:00:00.000Z", reviewedAt: "2026-09-24T09:30:00.000Z",
    message: "定期通院の頻度と、体調が変化した場合に必要な対応を教えてください。",
    messages: [
      followUp("rehomer", "2026-09-22T14:00:00.000Z", "現在は3か月ごとの通院と朝夕の投薬が必要です。食欲低下や呼吸の変化がある場合は早めの受診をお願いします。"),
      followUp("adopter-liam", "2026-09-23T18:20:00.000Z", "勤務と通院先までの距離を考えると継続対応が難しいため、今回は申込みに進まず相談を終了したいです。"),
      followUp("reviewer", "2026-09-24T09:30:00.000Z", consultationReply("closed")),
    ],
  },
  {
    userId: "adopter-mia", petId: "yuki", status: "profile_requested", createdAt: "2026-09-20T10:25:00.000Z", reviewedAt: "2026-09-21T11:15:00.000Z",
    message: "先住猫がいるため、別室で過ごす期間と対面を始める目安を確認したいです。",
    messages: [
      followUp("rehomer", "2026-09-20T15:10:00.000Z", "最初は完全に別室で過ごし、互いの匂いと生活音に落ち着いて反応できることを確認してから短時間の対面を始めます。"),
      followUp("adopter-mia", "2026-09-21T08:30:00.000Z", "隔離できる部屋があります。先住猫の健康記録も提出できます。"),
      followUp("reviewer-alex", "2026-09-21T11:15:00.000Z", reviewerRequest),
      followUp("adopter-mia", "2026-09-23T17:45:00.000Z", "必要事項を確認中です。家族と相談してからプロファイルを提出します。"),
    ],
  },
  {
    userId: "adopter-jack", petId: "sora", status: "profile_requested", createdAt: "2026-09-10T09:10:00.000Z", reviewedAt: "2026-09-11T10:45:00.000Z",
    message: "朝夕の運動に加えて、休日に必要な活動量とトレーニングについて相談したいです。",
    messages: [
      followUp("rehomer", "2026-09-10T15:00:00.000Z", "毎日の散歩に加え、匂い探しや基礎トレーニングを短時間ずつ行う計画を推奨します。休息時間も必要です。"),
      followUp("adopter-jack", "2026-09-11T08:15:00.000Z", "平日は朝夕、休日は公園での運動と室内トレーニングを組み合わせられます。"),
      followUp("reviewer", "2026-09-11T10:45:00.000Z", reviewerRequest),
      followUp("adopter-jack", "2026-09-12T16:00:00.000Z", profileSubmitted),
      followUp("reviewer", "2026-09-26T13:00:00.000Z", "トライアル結果と双方の確認記録を受領しました。現在は最終判断を確認しています。"),
    ],
  },
  {
    userId: "adopter-mia", petId: "hana", status: "closed", createdAt: "2026-09-15T12:30:00.000Z", reviewedAt: "2026-09-17T09:20:00.000Z",
    message: "小学生の子どもがいる家庭でも応募できますか。猫が落ち着ける部屋は用意できます。",
    messages: [
      followUp("rehomer-hana", "2026-09-15T16:00:00.000Z", "応募は可能です。大きな声や急な接触を避け、猫から近づくまで待てることを家族全員で確認してください。"),
      followUp("adopter-mia", "2026-09-16T18:30:00.000Z", "家族で相談しましたが、今は静かな環境を十分に保てないため、今回は相談のみで終了します。"),
      followUp("reviewer-alex", "2026-09-17T09:20:00.000Z", consultationReply("closed")),
    ],
  },
  { userId: "adopter-ava", petId: "kai", status: "received", createdAt: "2026-09-25T13:20:00.000Z", message: "大型犬の飼育経験はありません。必要な運動量と、初心者が準備すべきことを教えてください。", messages: [followUp("rehomer", "2026-09-25T17:40:00.000Z", "朝夕それぞれ45分前後の散歩に加え、室内での知育遊びが必要です。大型犬を安全に休ませられる場所と、滑りにくい床もご準備ください。") ] },
  { userId: "adopter-liam", petId: "riku", status: "received", createdAt: "2026-09-27T11:10:00.000Z", message: "在宅勤務中の生活リズムと、日中に必要なお世話について確認したいです。", messages: [followUp("rehomer-riku", "2026-09-27T15:30:00.000Z", "昼間は同じ部屋で静かに過ごせます。正午頃の食事と投薬、短い遊びの時間を確保してください。会議中に休める別スペースがあると安心です。") ] },
  {
    userId: "tester-1-adopter", petId: "tester-pet-1", status: "profile_requested", createdAt: "2026-09-29T11:01:00.000Z", reviewedAt: "2026-09-29T11:09:00.000Z",
    message: "test test test", messages: [
      followUp("tester-1-rehomer", "2026-09-29T11:04:00.000Z", "test 返信です。譲渡者として返信欄の表示を確認しました。"),
      followUp("tester-1-reviewer", "2026-09-29T11:09:00.000Z", "画面確認中にプロファイル提出の操作を選択しました。"),
    ],
  },
  {
    userId: "tester-2-adopter", petId: "tester-pet-2", status: "profile_requested", createdAt: "2026-09-29T12:03:00.000Z", reviewedAt: "2026-09-29T12:16:00.000Z",
    message: "このボタンが次のステップですか？ test", messages: [
      followUp("tester-2-rehomer", "2026-09-29T12:08:00.000Z", "短い返信を入力し、会話履歴が読みやすく表示されるか確認しました。"),
      followUp("tester-2-adopter", "2026-09-29T12:12:00.000Z", "分かりました。次はプロファイル画面を試します。"),
      followUp("tester-2-reviewer", "2026-09-29T12:16:00.000Z", "申込み準備へ進める操作を選択しました。"),
    ],
  },
  {
    userId: "tester-3-adopter", petId: "tester-pet-3", status: "profile_requested", createdAt: "2026-09-29T13:02:00.000Z", reviewedAt: "2026-09-29T13:11:00.000Z",
    message: "相談フォームと連絡先欄を確認しています。", messages: [
      followUp("tester-3-rehomer", "2026-09-29T13:06:00.000Z", "次へ進む前に、必要なケアの詳細を確認してください。返信表示の確認用文章です。"),
      followUp("tester-3-reviewer", "2026-09-29T13:11:00.000Z", "申込みを審査へ進める操作を行いました。"),
      followUp("tester-3-adopter", "2026-09-29T13:16:00.000Z", "test 書類をアップロード／次へボタンを確認"),
    ],
  },
  {
    userId: "tester-4-adopter", petId: "tester-pet-4", status: "profile_requested", createdAt: "2026-09-29T14:04:00.000Z", reviewedAt: "2026-09-29T14:18:00.000Z",
    message: "test", messages: [
      followUp("tester-4-rehomer", "2026-09-29T14:10:00.000Z", "test 返信"),
      followUp("tester-4-adopter", "2026-09-29T14:15:00.000Z", "ペットのプロファイルを開いてから、この相談画面へ戻る操作を試しました。"),
      followUp("tester-4-reviewer", "2026-09-29T14:18:00.000Z", "確認用の申込みを面談工程へ進めました。"),
    ],
  },
  {
    userId: "tester-5-adopter", petId: "tester-pet-5", status: "profile_requested", createdAt: "2026-09-29T15:01:00.000Z", reviewedAt: "2026-09-29T15:07:00.000Z",
    message: "譲渡者への直接の質問が、履歴上でどのように見えるか確認しています。", messages: [
      followUp("tester-5-rehomer", "2026-09-29T15:05:00.000Z", "日々のお世話と受け渡し方法について、実務を想定した返信を入力しました。"),
      followUp("tester-5-reviewer", "2026-09-29T15:07:00.000Z", "審査へ引き継ぐ操作を選択しました。"),
      followUp("tester-5-adopter", "2026-09-29T15:13:00.000Z", "test test／ステータス表示を確認"),
    ],
  },
  {
    userId: "tester-2-adopter", petId: "tester-pet-1", status: "closed", createdAt: "2026-09-29T12:20:00.000Z", reviewedAt: "2026-09-29T12:27:00.000Z",
    message: "test のみの相談です。申込みを開始せず、会話だけを確認します。", messages: [
      followUp("tester-1-rehomer", "2026-09-29T12:23:00.000Z", "test 返信：申込み前でも日々のお世話について相談できます。"),
      followUp("tester-2-adopter", "2026-09-29T12:25:00.000Z", "ありがとうございます。今日は相談の流れだけを確認します。"),
      followUp("tester-2-reviewer", "2026-09-29T12:27:00.000Z", "相談のみで終了し、審査ケースは作成しませんでした。"),
    ],
  },
];

export const sampleConsultations: Consultation[] = sampleRows.map((row, index) => ({
  ...row,
  id: `sample-consultation-${index + 1}`,
  requestId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
  contactEmail: `${row.userId}@pawmatch.test`,
  messages: row.messages.map((message, messageIndex) => ({ ...message, id: `sample-consultation-${index + 1}-message-${messageIndex + 1}` })),
  ...(row.status !== "received" ? { reviewedBy: row.messages.find(message => message.authorId.startsWith("reviewer"))?.authorId ?? "reviewer" } : {}),
  ...(row.status !== "received" ? { replyMessage: row.messages.filter(message => message.authorId.startsWith("reviewer")).at(-1)?.body ?? consultationReply(row.status) } : {}),
}));

function withSamples(records: Consultation[]) {
  const regular = records.filter(record => !record.id.startsWith("sample-consultation-"));
  const samples = sampleConsultations.map(sample => {
    const stored = records.find(record => record.id === sample.id);
    if (!stored?.messages) return sample;
    // Refresh canonical synthetic messages while preserving replies added in the running demo.
    const canonicalIds = new Set((sample.messages ?? []).map(message => message.id));
    const addedReplies = stored.messages.filter(message => !canonicalIds.has(message.id));
    return {
      ...sample,
      status: stored.status ?? sample.status,
      reviewedAt: stored.reviewedAt ?? sample.reviewedAt,
      reviewedBy: stored.reviewedBy ?? sample.reviewedBy,
      replyMessage: stored.replyMessage ?? sample.replyMessage,
      messages: [...(sample.messages ?? []), ...addedReplies],
    };
  });
  return [...regular, ...samples];
}

export async function getAllConsultations() {
  return withSamples(await readStore<Consultation[]>(key, () => [])).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function getConsultations(userId: DemoUserId, petId?: string) {
  return (await getAllConsultations()).filter(item => item.userId === userId && (!petId || item.petId === petId));
}
export async function saveConsultation(userId: DemoUserId, input: unknown) {
  const data = consultationInput.parse(input);
  return mutateStore<Consultation[], Consultation>(key, () => [], records => {
    const existing = records.find(item => item.userId === userId && item.requestId === data.requestId);
    if (existing) return existing;
    const record = { ...data, userId, id: randomUUID(), createdAt: new Date().toISOString(), status: "received" as const, messages: [] };
    records.push(record);
    return record;
  });
}
export async function updateConsultationStatus(id: string, status: Exclude<ConsultationStatus, "received">, reviewerId: DemoUserId) {
  return mutateStore<Consultation[], Consultation | null>(key, () => [], records => {
    records.splice(0, records.length, ...withSamples(records));
    const record = records.find(item => item.id === id);
    if (!record || (record.status ?? "received") !== "received") return null;
    const reviewedAt = new Date().toISOString();
    const replyMessage = consultationReply(status);
    record.status = status;
    record.reviewedAt = reviewedAt;
    record.reviewedBy = reviewerId;
    record.replyMessage = replyMessage;
    record.messages = [...(record.messages ?? []), {
      id: `${record.id}-message-${(record.messages?.length ?? 0) + 1}`,
      authorId: reviewerId, body: replyMessage, createdAt: reviewedAt,
    }];
    return record;
  });
}

export async function appendConsultationMessage(id: string, authorId: DemoUserId, input: unknown) {
  const data = consultationMessageInput.parse(input);
  return mutateStore<Consultation[], Consultation | null>(key, () => [], records => {
    records.splice(0, records.length, ...withSamples(records));
    const record = records.find(item => item.id === id);
    if (!record || record.status === "closed") return null;
    record.messages = [...(record.messages ?? []), {
      id: `${record.id}-message-${(record.messages?.length ?? 0) + 1}`,
      authorId,
      body: data.message,
      createdAt: new Date().toISOString(),
    }];
    return record;
  });
}
