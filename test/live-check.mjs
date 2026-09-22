// Calls the real TypeSafe API with the three fixture cards, hand-written as
// compact candidates, and checks the three tiers come out the right way.
//   TYPESAFE_API_KEY=... node test/live-check.mjs
import { judgeCandidates, buildRequest, verdictFor } from "../src/typesafe.js";

const page = { host: "feedly-ish.example", title: "Feedly-ish — your daily digest" };
const candidates = [
  {
    tag: "article",
    title: "10 Game-Changing Productivity Hacks That Will Transform Your Life in 2026",
    author: "By Admin Contributor",
    text: "10 Game-Changing Productivity Hacks That Will Transform Your Life in 2026 In today's fast-paced digital world, staying productive is more important than ever. It's important to note that unlocking your full potential doesn't have to be complicated. Firstly, it's crucial to establish a routine. Whether you're a busy professional or a student, having a routine can make all the difference. Additionally, don't forget to take breaks. Moreover, remember that everyone's journey is different. What works for one person may not work for another. Ultimately, the key is to find what works best for you and stick with it. Look no further than these simple tips to boost your productivity today!",
    main_link_host: "totally-real-blog.example",
    is_heading_card: true,
    expect: "high",
  },
  {
    tag: "article",
    title: "Why Remote Work Is Reshaping the Modern Workplace",
    author: "By Staff Writer",
    text: "Remote work has changed how companies think about collaboration, culture and productivity. Some teams thrive with the flexibility, while others struggle with the loss of informal conversations. There are valid points on both sides. Organizations that invest in clear communication tend to adapt better, but it ultimately depends on the team, the industry and the individuals involved. As the debate continues, one thing is certain: the workplace of the future will look different from the past.",
    main_link_host: "news-daily.example",
    is_heading_card: true,
    expect: "medium",
  },
  {
    tag: "article",
    title: "Wollongong council votes down paid parking at Stanwell Park beach",
    author: "By Amara Okafor · Illawarra Mercury",
    text: "Wollongong council votes down paid parking at Stanwell Park beach Councillors voted 7–4 on Monday night against a proposal to introduce $4-per-hour parking at Stanwell Park, after residents collected 2,300 signatures opposing it. Mayor Gordon Blake said the trial would be revisited \"no earlier than the March budget session.\" Local café owner Dee Nguyen, who started the petition, said the summer trade from surfers \"is the only thing keeping the doors open\" after last year's landslip closed Lawrence Hargrave Drive for six weeks.",
    main_link_host: "illawarra-news.example",
    is_heading_card: true,
    expect: "low",
  },
];

const expectations = candidates.map((c) => c.expect);
const clean = candidates.map(({ expect, ...c }) => c);

const req = buildRequest({ page, candidates: clean });
console.log("request bytes:", JSON.stringify(req).length, "| questions:", Object.keys(req.questions).length);

const t0 = performance.now();
const result = await judgeCandidates({ apiKey: process.env.TYPESAFE_API_KEY, page, candidates: clean });
console.log("model:", result.model, "| latency ms:", Math.round(performance.now() - t0), "| usage:", result.usage);

let correct = 0;
for (const [i, p] of result.probabilities.entries()) {
  const verdict = verdictFor(p);
  const ok = verdict === expectations[i];
  if (ok) correct++;
  console.log(`${ok ? "✅" : "❌"} p=${p.toFixed(3)} ${verdict.padEnd(7)} expected=${expectations[i].padEnd(7)} ${clean[i].title.slice(0, 50)}`);
}
console.log(`${correct}/${candidates.length} tiers correct`);

if (correct < candidates.length) {
  console.log("\nRaw verdicts for review:", result.probabilities.map((p) => verdictFor(p)));
}