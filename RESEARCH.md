# Research: Slop Detector

## 1. TypeSafe Jev API Specification

Source documentation opened and verified in Microsoft Edge:
- Endpoint reference: https://docs.typesafe.ai/api
- Primitive reference: https://docs.typesafe.ai/primitives/score
- Model reference: https://docs.typesafe.ai/models

### Exact Endpoint
- URL: POST https://api.typesafe.ai/v1/systemone
- Authentication: Header `Authorization: Bearer <API_KEY>`
- Content Type: `application/json`

### Model Selection
- Primary model alias: `jev-latest`
- Active version resolved: `jev-1.13.0`
- Role: TypeSafe flagship System One model designed for fast, calibrated semantic evaluations.

### Request Schema
```json
{
  "state": "String containing post text to evaluate",
  "model": "jev-latest",
  "questions": {
    "slop_score": {
      "type": "score",
      "instructions": "Rate how likely this post is to be generic AI-generated slop, motivational spam, engagement bait, or unoriginal synthetic content.",
      "criteria": [
        "Original human post with personal voice, specific experience, authentic thought, or genuine reporting",
        "Mixed or ambiguous, standard phrasing, common commentary, or mildly formulaic structure",
        "Formulaic AI-generated slop, generic motivational platitudes, engagement bait, or buzzword-stuffed synthetic content"
      ]
    }
  }
}
```

### Response Schema
```json
{
  "model": "jev-1.13.0",
  "answers": {
    "slop_score": {
      "type": "score",
      "score": 1.43,
      "confidence": 0.35,
      "legend": {
        "0": "Original human post with personal voice, specific experience, authentic thought, or genuine reporting",
        "1": "Mixed or ambiguous, standard phrasing, common commentary, or mildly formulaic structure",
        "2": "Formulaic AI-generated slop, generic motivational platitudes, engagement bait, or buzzword-stuffed synthetic content"
      },
      "probabilities": {
        "0": 0.0,
        "1": 0.57,
        "2": 0.43
      }
    }
  },
  "usage": {
    "input_tokens": 304,
    "output_tokens": 18
  }
}
```

### Limits and Pricing
- Rate limit: 250,000 tokens per second and 1,200 requests per minute.
- Context limit: 64k tokens per request total, 32k tokens for state plus longest question.
- Pricing: $42 per billion input tokens ($0.042 per million input tokens). Output tokens are free.

### Error Codes and Resilience
- 401 Unauthorized: Missing or invalid API key. Must verify key on relay server.
- 422 Unprocessable Entity: Malformed question or payload failure.
- 429 Too Many Requests: Rate limit exceeded. Exponential backoff retry required.
- 529 Overloaded: TypeSafe temporary capacity overload. Exponential backoff retry required.

***

## 2. Market and Community Analysis: Robin Bilgil's Post

Source post opened and verified in Microsoft Edge:
- URL: https://x.com/RBilgil/status/2100976648552169805
- Author: Robin Bilgil (@RBilgil)
- Date: September 18, 2026
- Engagement metrics: 777,000 views, 16,000 likes, 804 reposts, 4,200 bookmarks, 484 replies.

### What Users Praised
- Immediate visual impact: Viewers loved knowing whether a post was worth reading before processing text.
- Speed: Real time scoring while scrolling created strong product satisfaction.
- The hook: "Made a real-time slop detector with jev as you scroll" resonated across technical and non-technical feeds.

### Unwritten Requirements and User Complaints
- Hiding versus marking: Several users asked why posts were not completely hidden. Robin noted that while hiding was requested, marking was far more compelling for demonstrations. The standing product constraint confirms this: never remove, hide, collapse, or blur content. Overlays must remain purely additive.
- Detection accuracy skepticism: Skeptics noted that binary AI detectors fail and have false positives. Robin acknowledged that heuristic classification is not absolute proof, which is why the system must frame verdicts as "likely AI slop" rather than claiming factual AI authorship.
- Customizability: Users demanded configurable prompts, thresholds, and filters.

### Growth Dynamics
- Hook: A single, punchy claim paired with high contrast video proof.
- Visual clarity: Red boxes immediately signal caution while green validates authentic human work.
- Narrative: Empowering users against feed degradation.

***

## 3. Feed Structure on X (x.com)

Inspected live in Microsoft Edge on https://x.com/home:
- Tweet Card Container: `article[data-testid="tweet"]`
- Tweet Text Container: `[data-testid="tweetText"]`
- Layout constraints: Cards have dynamic height, rounded corners, and virtualized feed rendering where nodes leave and enter the DOM during scrolling.
- Boundary box requirement: Borders must adhere strictly to `article[data-testid="tweet"]` bounding boxes without bleeding into the feed gutters or spanning adjacent cards.
