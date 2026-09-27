import { z } from "zod";
import { configSchema, createSessionSchema, responseSchema, codingSchema } from "./research/validation";
import { reviewInput } from "./review-store";
import { consultationInput } from "./consultations";
import { adopterProfileInput } from "./adopter-profile";
import { demoUsers } from "./demoUsers";
const jsonBody=(schema:unknown)=>({required:true,content:{"application/json":{schema}}});
const success={ "401":{description:"未ログイン・セッション失効"}, "403":{description:"ロール権限なし、または別Originからの操作"}, "200":{description:"成功"}, "400":{description:"入力が不正、または状態が不一致"}, "404":{description:"記録なし"} };
const idParameter=[{name:"id",in:"path",required:true,schema:{type:"string"}}];
export const openApiSpec={
  openapi:"3.1.0",
  info:{title:"PawMatch Safe Rehome API",version:"0.3.0",description:"合成データによる審査と比較評価。ロール別のページ・API認可を実施。研究者APIは管理者のみ。明示的なテストロール選択は本番認証ではありません。"},
  servers:[{url:"/api"}],
  components:{securitySchemes:{demoSession:{type:"apiKey",in:"cookie",name:"pawmatch-demo-session",description:"POST /demo-session で選択したテストユーザー。12時間で失効、ログアウト時にサーバーで無効化。"}}},
  security:[{demoSession:[]}],
  paths:{
    "/demo-session":{
      get:{security:[],summary:"現在のテストユーザーを取得（未ログインはnull）",responses:success},
      post:{security:[],summary:"管理者・審査担当・譲渡者・里親希望者のテストユーザーを選択。本番認証ではない",requestBody:jsonBody({type:"object",required:["userId"],properties:{userId:{enum:demoUsers.map(user => user.id)}}}),responses:{...success,"403":{description:"別Originからの操作"}}},
      delete:{security:[],summary:"サーバーのセッションを無効化しCookieを消去",responses:success},
    },
    "/consultations":{
      get:{summary:"里親希望者・管理者：自分の相談履歴",parameters:[{name:"petId",in:"query",schema:{type:"string"}}],responses:{...success,"401":{description:"未ログイン"}}},
      post:{summary:"里親希望者・管理者：相談を保存。外部送信なし。requestIdで再送の重複を防止",requestBody:jsonBody(z.toJSONSchema(consultationInput)),responses:{...success,"201":{description:"保存済み相談"},"401":{description:"未ログイン"},"403":{description:"別Originからの操作"},"500":{description:"保存失敗"}}},
    },
    "/adopter-profile":{
      get:{summary:"里親希望者・管理者：自分のプロファイルと本人確認状態",responses:success},
      put:{summary:"里親希望者・管理者：自分のプロファイルを保存",requestBody:jsonBody(z.toJSONSchema(adopterProfileInput)),responses:success},
    },
    "/adopter-documents":{
      get:{summary:"里親希望者・管理者：自分の一般書類の一覧",responses:success},
      post:{summary:"里親希望者・管理者：2MB以下のPDF・PNG・JPEGを登録",responses:success},
    },
    "/adopter-documents/{id}":{
      get:{summary:"本人・審査担当・管理者：一般書類をダウンロード",parameters:idParameter,responses:success},
      delete:{summary:"本人：自分で登録した一般書類を削除。組み込みの例示資料は削除不可",parameters:idParameter,responses:success},
    },
    "/pets":{get:{security:[],summary:"合成の動物プロファイル",responses:success}},
    "/applications":{get:{summary:"譲渡者は自分の掲載分のみ、審査担当・管理者は全件：根拠付きスコア・リスク・審査記録",parameters:[{name:"petId",in:"query",schema:{type:"string"}}],responses:success}},
    "/applications/{id}":{patch:{summary:"譲渡者は自分の掲載分のみ、審査担当・管理者は全件：確認・進捗・判断と理由を保存（revisionで競合検出）",parameters:idParameter,requestBody:jsonBody(z.toJSONSchema(reviewInput)),responses:success}},
    "/seed":{post:{summary:"合成プロファイルをMongoDBへ登録",responses:success}},
    "/research/config":{get:{summary:"研究設定を取得",responses:success},put:{summary:"研究設定を保存。発行済みセッションは変更しない",requestBody:jsonBody(z.toJSONSchema(configSchema)),responses:success}},
    "/research/sessions":{post:{summary:"評価セッションを発行し、ケース・基準・採点結果を固定",requestBody:jsonBody(z.toJSONSchema(createSessionSchema)),responses:{...success,"201":{description:"匿名コード・セッションID・表示順"}}}},
    "/research/sessions/{id}":{
      get:{security:[],summary:"招待URLのIDを持つ参加者：現在の課題のみ取得。基本表示には推論結果・想定解答を含めない",parameters:idParameter,responses:success},
      post:{security:[],summary:"招待URLのIDを持つ参加者：参加同意・課題開始・回答送信・回答削除と中止",parameters:idParameter,requestBody:jsonBody({oneOf:[
        {type:"object",required:["action"],properties:{action:{type:"string",enum:["consent","start","withdraw"]}}},
        {type:"object",required:["action","response"],properties:{action:{const:"respond"},response:z.toJSONSchema(responseSchema)}},
      ]}),responses:success},
    },
    "/research/coding":{put:{summary:"研究者による自由記述のリスク照合・説明採点",requestBody:jsonBody(z.toJSONSchema(codingSchema)),responses:success}},
    "/research/export":{get:{summary:"参加者／合成を区別したCSV、または条件スナップショットJSON",parameters:[{name:"source",in:"query",schema:{type:"string",enum:["participant","simulation"],default:"participant"}},{name:"format",in:"query",schema:{type:"string",enum:["csv","json","dataset"],default:"csv"}}],responses:{"200":{description:"CSVまたはJSON。datasetは合成ケースと現在の設定のみ。"}}}},
    "/openapi":{get:{summary:"管理者：OpenAPI定義",responses:success}},
  },
};
