# Research: Real Time AI Slop Detector

## Stage 1: Research Documentation

All facts below were researched and read directly from live pages opened in Microsoft Edge on the remote debugging port.

### 1. TypeSafe Jev API Contract

The official TypeSafe documentation was accessed and read from the official site.

- Evaluation Endpoint: `POST https://api.typesafe.ai/v1/systemone` (Source: https://docs.typesafe.ai/api#evaluation-endpoint)
- Authentication: `Authorization: Bearer <API_KEY>` header (Source: https://docs.typesafe.ai/api#evaluation-endpoint)
- Content Type: `Content-Type: application/json` (Source: https://docs.typesafe.ai/api#evaluation-endpoint)

#### Request Body Structure
Source: https://docs.typesafe.ai/api#request-body

- `state` (string | object | array, required): The content to evaluate. For social post evaluation, a plain text string containing the card text is supplied. (Source: https://docs.typesafe.ai/api#param-state)
- `model` (string, required): Model identifier. Recommended stable flagship model alias is `jev-latest`, resolving to `jev-1.13.0`. (Source: https://docs.typesafe.ai/api#param-model, https://docs.typesafe.ai/models#aliases)
- `questions` (map<string, Question>, required): A map of typed question objects. Answers are returned under matching keys. (Source: https://docs.typesafe.ai/api#param-questions)

#### Score Question Type
Source: https://docs.typesafe.ai/api#score, https://docs.typesafe.ai/primitives/score

- `type`: Must be `"score"`. (Source: https://docs.typesafe.ai/api#param-type-2)
- `instructions` (string | object | array, required): The rating prompt or question submitted to the model. (Source: https://docs.typesafe.ai/api#param-instructions-2)
- `criteria` (array<string | object | array>, required): An ordered array of descriptive levels from lowest to highest. Must have between 2 and 10 levels. (Source: https://docs.typesafe.ai/api#param-criteria-2)

#### Response Body Structure
Source: https://docs.typesafe.ai/api#response-body, https://docs.typesafe.ai/primitives/score#response-structure

- `model` (string): The versioned model that performed the evaluation, such as `jev-1.13.0`. (Source: https://docs.typesafe.ai/api#param-model-1)
- `answers` (map<string, ScoreAnswer>): Map of returned answers keyed by question identifier. (Source: https://docs.typesafe.ai/api#param-answers)
- `usage` (object): Token consumption reporting `input_tokens` and `output_tokens`. Output tokens are free. (Source: https://docs.typesafe.ai/api#param-usage, https://docs.typesafe.ai/models#current-models)

ScoreAnswer fields:
- `type`: `"score"`. (Source: https://docs.typesafe.ai/api#param-type-5)
- `score` (number): The probability-weighted position across criteria levels. (Source: https://docs.typesafe.ai/api#param-score)
- `confidence` (number): Certainty value between 0.0 and 1.0 derived from probability distribution. (Source: https://docs.typesafe.ai/api#param-confidence-1)
- `legend` (map<string, string>): Level indices mapped to descriptions. (Source: https://docs.typesafe.ai/api#param-legend)
- `probabilities` (map<string, number>): Map of level index to float probability summing to 1.0. (Source: https://docs.typesafe.ai/api#param-probabilities-1)

#### Limits and Error Codes
Source: https://docs.typesafe.ai/api#errors, https://docs.typesafe.ai/models#current-models

- HTTP 401 Unauthorized: Missing or invalid API key. (Source: https://docs.typesafe.ai/api#errors)
- HTTP 422 Unprocessable Entity: Malformed request body or schema validation failure. (Source: https://docs.typesafe.ai/api#errors)
- HTTP 429 Too Many Requests: Rate limit exceeded. Handled with exponential backoff. (Source: https://docs.typesafe.ai/api#errors, https://docs.typesafe.ai/api#handling-rate-limits)
- HTTP 529 Overloaded: Server temporary overload. Handled with retry after delay. (Source: https://docs.typesafe.ai/api#errors)
- Rate Limits: 250,000 tokens per second, 1,200 requests per minute. (Source: https://docs.typesafe.ai/models#current-models)
- Context Limits: 64k tokens per request total, 32k tokens for state plus longest question. (Source: https://docs.typesafe.ai/models#current-models)
- Cost: $42 per billion input tokens ($0.042 per million input tokens), output tokens free. (Source: https://docs.typesafe.ai/models#current-models)

### 2. Reference Product Analysis

Source: https://x.com/RBilgil/status/2100976648552169805

- Author: Robin Bilgil (@RBilgil)
- Post Date: September 18, 2026
- Reach and Engagement: 773.7K views, 16,046 likes, 801 reposts, 485 replies, 4,226 bookmarks
- Reference Behaviour: Scans feed cards in real time while scrolling. Renders an angled red stamp "SLOP" across cards and a pill badge `• Slop | 85%` (or 79%).

### 3. Requirements Extracted from Replies

Source: https://x.com/RBilgil/status/2100976648552169805

1. Non-destructive Display:
   User @pieropan asked: "Could you just hide it instead of marking it?"
   Robin Bilgil responded: "Probably should be the default but the demo is less compelling!"
   Hiding or collapsing posts risks false positives where legitimate content is lost. Overlays must remain purely additive: never remove, collapse, hide, or filter content.

2. Accurate Language and Calibration:
   User @talesreisa criticized generic AI detectors as unreliable.
   Robin Bilgil acknowledged: "Yes not a reliable AI detector but you can tune it to filter things out based on any prompt which is still really valuable" and "Jev might need some tuning".
   The product must never claim certainty or declare content "is AI-generated". It must report calibrated confidence: "likely AI slop".

3. Compact Badging:
   The huge stamp in Robin's demo blocked post content. Users require a legible pill badge on high-confidence cards (score 80 and above), an outline on moderate-confidence cards (score 40 to 79), and zero alteration on low-confidence cards (under 40).

4. Configurable Thresholds:
   User @0xWillyham requested configurable classification and open source release. Robin confirmed making settings configurable. The options page must allow customizing threshold numbers.

5. Single Jev Evaluation per Card:
   Feed scrolling requires fast, low-latency evaluation without chaining multiple requests. One Jev score question per card.

### 4. Growth Notes

- Hook: Real-time scrolling evaluation directly on X feed.
- Visual Proof: Clear visual differentiation on cards with instant score display.
- Controversy and Demand: Feed degradation from generic AI accounts is an intense pain point for everyday users.
- Launch Post Focus: Emphasize calibrated scoring, non-destructive overlays, Chrome MV3 compliance, and server-side relay protection for API credentials.
