from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.shared import Inches, RGBColor


ROOT = Path(__file__).resolve().parents[1]
REPORTS = ROOT / "docs" / "reports"
FIGURES = REPORTS / "figures"
RED = RGBColor(0xC0, 0x00, 0x00)


def set_red(paragraph, text, style=None):
    paragraph.clear()
    if style:
        paragraph.style = style
    run = paragraph.add_run(text)
    run.font.color.rgb = RED


def insert_after(paragraph, text="", style=None):
    element = OxmlElement("w:p")
    paragraph._p.addnext(element)
    result = paragraph._parent.add_paragraph()
    result._p.getparent().remove(result._p)
    element.getparent().replace(element, result._p)
    if style:
        result.style = style
    if text:
        run = result.add_run(text)
        run.font.color.rgb = RED
    return result


def insert_picture(after, image_path, caption, width=6.35):
    image_paragraph = insert_after(after)
    image_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    image_paragraph.paragraph_format.keep_with_next = True
    image_paragraph.add_run().add_picture(str(image_path), width=Inches(width))
    caption_paragraph = insert_after(image_paragraph, caption, "Caption")
    caption_paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    caption_paragraph.paragraph_format.keep_together = True
    return caption_paragraph


def find_start(document, prefix):
    return next(paragraph for paragraph in document.paragraphs if paragraph.text.startswith(prefix))


def find_any_start(document, prefixes):
    return next(paragraph for paragraph in document.paragraphs if any(paragraph.text.startswith(prefix) for prefix in prefixes))


def remove_paragraph(paragraph):
    parent = paragraph._element.getparent()
    parent.remove(paragraph._element)


def remove_existing_figure(document, caption_prefix):
    for paragraph in list(document.paragraphs):
        if not paragraph.text.startswith(caption_prefix):
            continue
        previous = paragraph._element.getprevious()
        if previous is not None and previous.tag.endswith("}p") and previous.xpath(".//w:drawing"):
            previous.getparent().remove(previous)
        remove_paragraph(paragraph)


PROTOCOL = {
    "en": {
        "title": "6.1 Five-participant session procedure",
        "intro": "Each participant completes one moderated session of approximately 35–45 minutes. The participant acts as a reviewer for the experimental tasks; the researcher-led all-role journey remains a technical verification and is not mixed with the participant outcome measures.",
        "steps": [
            "1. Recruit five consenting adults using pragmatic purposive sampling: where possible, include two current or previous pet carers, one person with rescue or rehoming experience, and two adults without specialist experience. Record relevant experience, but do not present the group as representative.",
            "2. Send a short information sheet in advance and record oral or email consent. Assign participant codes P01–P05; do not collect identity documents, addresses or real adoption records.",
            "3. Run the study on the researcher's computer or a prepared hosted instance. Start a fresh research session for each participant so that saved answers and workflow changes do not carry across participants.",
            "4. Give a five-minute neutral orientation to the four roles and the meaning of scores, warnings and verification states. Do not explain the case risks that form the coding rubric.",
            "5. Ask each participant to complete four tasks: two synthetic cases in both Application information only and With PawMatch review support. Alternate AB/BA order across participants (three in one order and two in the other). For every task, record the selected action, important risks, written reason and next checks.",
            "6. Immediately after each task, collect 1–5 ratings for usefulness, information clarity, confidence in explaining the decision and reliance on the screen conclusion or score. The moderator records assistance, navigation errors, omitted critical risks and interruptions. Elapsed time is contextual only.",
            "7. Finish with a short interview on confusing information, trust, missing evidence and role clarity. Code written answers against the frozen rubric before viewing aggregate ratings, then report participant-level denominators, medians, ranges, counterexamples and missing data without inferential significance claims.",
        ],
        "figure_intro": "Figure 6 provides dated implementation evidence for the two operational views used to inspect the review workflow. The screenshots show the Japanese-language prototype; the same interface provides an English display option.",
        "figure_a": "Figure 6a Review progress board showing one application per row, dated 29 September 2026. Source: author.",
        "figure_b": "Figure 6b Case-level suitability review showing stage, role responsibilities and human-controlled actions, dated 29 September 2026. Source: author.",
        "verification": "Table 4 reports checks run on the local working tree on 29 September 2026. All 50 automated tests passed. They cover role boundaries, listing ownership, consultation ownership, synthetic-case consistency, separation of scores from verification, propagation of administrator weights, consent and withdrawal in study sessions, prepared decline and completed-adoption outcomes, and human-gated final review. A complete Bella scenario begins with the rehomer's published listing and opaque listing number, then checks the adopter's enquiry, replies by the rehomer and PawMatch operations, suitability and document review, joint meeting, trial and final sign-off, adoption approval, and chronological dates for every completed stage. Seven additional HTTP suites passed against an isolated production build; these included 151 role/page/API boundary checks plus login, consultation, document, navigation, persistence, research-session and withdrawal journeys. These checks establish selected software behaviour; they do not establish usability, fairness, animal-welfare impact or adoption outcomes.",
        "conclusion": "This study advances a specific design hypothesis: rehoming review may be simplified not by omitting checks, but by bringing each animal's care needs, the applicant's plan, outstanding evidence and the next human action into one traceable decision. The prototype implements that workflow. All 50 automated tests and seven isolated production HTTP suites passed, including an all-role journey that begins with a published listing and completes enquiry, review and adoption approval while preserving permissions and chronological dates. These results establish technical feasibility and internal consistency, but do not show that people make better decisions with the interface.",
        "date": "Serika Kawano | CSM500 | 29 September 2026",
        "table_result": "50 passed; 0 failed",
        "table_scope": "Listings, roles, ownership, research sessions, scoring, prepared outcomes and an all-role completed adoption journey.",
    },
    "ja": {
        "title": "6.1 5名による参加者評価の手順",
        "intro": "各参加者には、約35～45分の進行付きセッションへ1回参加してもらう。実験課題では参加者を審査担当者の立場にそろえる。研究者が行う全ロール横断の譲渡シナリオは技術検証として分け、参加者評価の成果指標には混ぜない。",
        "steps": [
            "1．同意を得た成人5名を現実的な目的抽出で募集する。可能であれば、現在または過去のペット飼育者2名、保護・譲渡に関わった経験のある人1名、専門経験のない成人2名を含める。関連経験は記録するが、5名を母集団の代表とは扱わない。",
            "2．事前に短い説明文を送り、口頭またはEメールで同意を記録する。参加者コードP01～P05を割り当て、本人確認書類、住所、実際の譲渡記録は収集しない。",
            "3．研究者のPCまたは用意したサーバ上で実施する。参加者ごとに新しい研究セッションを開始し、前の参加者の回答や工程変更を引き継がない。",
            "4．最初の5分で4ロールと、点数、警告、確認状態の意味を中立的に説明する。ただし、採点基準となるケース固有の想定リスクは教えない。",
            "5．各参加者は、合成2ケースを「申込情報のみ」と「PawMatch確認支援付き」の両方で扱い、計4課題に回答する。AB／BA順を交互に割り当て、3名と2名に分ける。各課題で対応、重要リスク、判断理由、次の確認を記録する。",
            "6．各課題の直後に、有用性、情報の分かりやすさ、判断理由を説明できる自信、画面の結論・点数への依存を1～5で回答してもらう。進行者は助言の有無、操作上の誤り、重要リスクの見落とし、中断を記録する。経過時間は参考値にとどめる。",
            "7．最後に、分かりにくい情報、信頼、足りない証拠、役割の分かりやすさを短く聞く。集計前に固定した基準で自由記述を判定し、参加者単位の分母、中央値、範囲、反対例、欠測を示す。統計的有意差は主張しない。",
        ],
        "figure_intro": "図6は、審査の流れを確認する二つの主要画面について、実装時点の画面証拠を示す。画面は日本語表示であり、同じインターフェースを英語表示へ切り替えることもできる。",
        "figure_a": "図6a 1申込みを1行で示す審査進捗ボード（2026年9月29日撮影）。出典：筆者。",
        "figure_b": "図6b 工程、役割分担、人が行う操作を示す適合性確認画面（2026年9月29日撮影）。出典：筆者。",
        "verification": "表4は2026年9月29日にローカルの作業ツリーで行った検証を示す。50件の自動テストはすべて成功した。対象は、役割の境界、掲載情報の所有者、相談情報の所有者、合成ケースの整合性、採点と確認状態の区別、管理者の重み変更の反映、研究参加の同意と撤回、見送り・譲渡済みの準備済みケース、人による最終審査である。Bellaの1ケースでは、譲渡者による掲載と推測しにくい掲載番号から始め、里親希望者の相談、譲渡者とPawMatch運営の返信、適合性・書類確認、双方が確認する面談・トライアル・最終判断、譲渡承認までを一続きで検証し、完了工程の日時が時系列に沿うことを確認した。さらに、隔離した本番ビルドに対して7本のHTTP検証を行い、151通りのロール別ページ・API境界に加え、ログイン、相談、書類、ナビゲーション、保存、研究セッション、撤回の流れがすべて成功した。これはソフトウェア動作の確認であり、使いやすさ、公平性、動物福祉、実際の譲渡成果の証拠ではない。",
        "conclusion": "本研究の中心仮説は、譲渡審査の簡略化とは確認を省くことではなく、動物ごとの世話の条件、応募者の計画、未確認の証拠、次に人が行う対応を一件の判断につなげることだ、というものである。試作はこの流れを実装した。50件の自動テストと隔離した本番ビルドに対する7本のHTTP検証はすべて成功し、掲載から相談、審査、譲渡承認までの全ロール横断シナリオも、権限と日時の整合性を保って完了した。これにより技術的な実現可能性と内部整合性は示されたが、人の判断が改善したとはまだいえない。",
        "date": "Serika Kawano | CSM500 | 2026年9月29日",
        "table_result": "50件成功、失敗0件",
        "table_scope": "掲載、役割、所有権、研究セッション、採点、準備済みの結果、全ロール横断の譲渡完了。",
    },
}


def update_report(path, language):
    document = Document(path)
    copy = PROTOCOL[language]

    set_red(document.paragraphs[2], copy["date"])
    set_red(find_start(document, "Table 4 reports" if language == "en" else "表4は"), copy["verification"])
    set_red(find_start(document, "This study advances" if language == "en" else "本研究の中心仮説は"), copy["conclusion"])
    set_red(
        find_start(document, "Table 4 Local automated verification" if language == "en" else "表4 2026"),
        "Table 4 Local automated verification on 29 September 2026" if language == "en" else "表4 ローカル自動検証（2026年9月29日）",
    )

    verification_table = document.tables[3]
    set_red(verification_table.cell(1, 1).paragraphs[0], copy["table_result"])
    set_red(verification_table.cell(1, 2).paragraphs[0], copy["table_scope"])

    protocol_marker = copy["title"]
    if not any(paragraph.text == protocol_marker for paragraph in document.paragraphs):
        anchor = find_start(document, "Each participant will see" if language == "en" else "各参加者は合成の2ケース")
        current = insert_after(anchor, protocol_marker, "Heading 2")
        current = insert_after(current, copy["intro"], "Normal")
        for step in copy["steps"]:
            current = insert_after(current, step, "Normal")

    figure_anchor = find_any_start(
        document,
        ["Figure 6 Planned UI evidence", copy["figure_intro"]] if language == "en" else ["図6 画面例予定", copy["figure_intro"]],
    )
    set_red(figure_anchor, copy["figure_intro"])
    remove_existing_figure(document, "Figure 6a" if language == "en" else "図6a")
    remove_existing_figure(document, "Figure 6b" if language == "en" else "図6b")
    current = insert_picture(figure_anchor, FIGURES / "review-progress-board-en.png", copy["figure_a"])
    insert_picture(current, FIGURES / "review-case-en.png", copy["figure_b"])

    document.save(path)


if __name__ == "__main__":
    update_report(REPORTS / "Final_Report_Integrated_Draft_EN.docx", "en")
    update_report(REPORTS / "Final_Report_Integrated_Draft_JA.docx", "ja")
    print("Updated both integrated report drafts with final QA evidence and the five-participant protocol.")
