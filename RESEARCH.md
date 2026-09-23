# Research: Slop Detector

## 1. TypeSafe Jev API Contract

All facts in this section were read directly from pages opened in the attached browser.

### Endpoint and Authentication
- Documentation URL: https://docs.typesafe.ai/api
- Endpoint: POST https://api.typesafe.ai/v1/systemone
- Headers:
  - Authorization: Bearer <API_KEY>
  - Content-Type: application/json

### Models and Pricing
- Documentation URL: https://docs.typesafe.ai/models
- Default model alias: "jev-latest" (resolves to versioned ID "jev-1.13.0")
- Versioned model ID: "jev-1.13.0"
- Pricing: $42 per billion tokens ($0.042 per million tokens) on input tokens. Output tokens are free.
- Rate limits: 250,000 tokens per second, 1,200 requests per minute. Breaches return HTTP 429.
- Context length: 64k tokens per request. 32k tokens for state plus the longest question.
- Input modality: Text only (string, JSON object, or array of strings).

### Request Shape
- Documentation URL: https://docs.typesafe.ai/api
- Schema:
  - state (string | object | array, required): The content to evaluate.
  - model (string, required): Model identifier, e.g. "jev-latest".
  - questions (map<string, Question>, required): Map of question objects keyed by caller-selected identifier.

### Question Types and Primitives
- Documentation URL: https://docs.typesafe.ai/primitives
- Documentation URL: https://docs.typesafe.ai/primitives/score
- Score question shape:
  - type: "score" (required)
  - instructions: string | object | array (required). The evaluation task for the model.
  - criteria: array<string | object | array> (required). Ordered array of 2 to 10 level descriptions from low to high.
- Score response shape:
  - type: "score"
  - score: number. Probability-weighted mean across level indices (0 to criteria.length - 1).
  - legend: map<string, string>. Level number to level description.
  - probabilities: map<string, number>. Probability assigned to each level index.
  - confidence: number between 0 and 1. Reflects peak concentration of the probability distribution.

### Error Codes and Resilience
- Documentation URL: https://docs.typesafe.ai/api
- 401 Unauthorized: Missing or invalid API key.
- 422 Unprocessable Entity: Request body failed validation.
- 429 Too Many Requests: Rate limit exceeded. Requires exponential backoff.
- 529 Overloaded: Temporary platform overload. Requires exponential backoff.

## 2. Reference Product Analysis

All facts in this section were read directly from https://x.com/RBilgil/status/2100976648552169805 in the attached browser.

### Post Details
- Author: Robin Bilgil (@RBilgil)
- Text: "Made a real-time slop detector with jev as you scroll"
- Video duration: 11 seconds
- Video frames observed:
  - Shows scrolling the X home timeline.
  - Adds a pill badge below tweet text: "• Not slop | 37%", "• Not slop | 44%", "• Slop | 82%".
  - High score cards also received a large stamped graphic ("SLOP") diagonally across the card.

### Community Reaction and Requirements from Replies
- Total engagement: 773.2K views, 16K likes, 4.2K bookmarks, 801 reposts, 485 replies.
- Praise:
  - Users were impressed by the real-time speed and unobtrusive evaluation during active scrolling.
  - Decision model efficiency ($0.042/Mtok) made per-card evaluation economically practical.
- Requests:
  - David Pieropan (@pieropan): "Could you just hide it instead of marking it?"
  - Willyham (@0xWillyham): "Would love to be able to configure what it classifies and then just hides automatically"
  - Robin Bilgil (@RBilgil): Agreed configurable thresholds and prompts belong in options.
- Concerns and Skepticism:
  - Tales (@talesreisa): Skeptical of AI detection reliability in general, arguing binary detection often fails.
  - Student Offers (@StudentOffersHQ): Noted risk of false positives where good posts get misclassified.
  - Robin Bilgil (@RBilgil): "Jev might need some tuning... not a reliable AI detector but you can tune it to filter things out based on any prompt which is still really valuable".

## 3. Product Rules and Design Decisions

To address community feedback while maintaining strict adherence to product rules:
1. One Jev question per card: Single score question per visible tweet, no batching.
2. Score >= 80: "LIKELY AI SLOP" badge carrying the score percentage. Compact pill format. We deviate from Robin's diagonal "SLOP" stamp because stamps obscure text and create visual noise.
3. Score 40 to 79: "CHECK THIS" outline around the card. No badge, no accusation.
4. Score < 40: Untouched. Preserves feed cleanliness for genuine human posts.
5. Additive only: Content is never hidden, removed, or collapsed, preventing accidental censorship or loss of context.
6. Terminology: Always "likely AI slop", never "is AI-generated". The product reports confidence rather than absolute truth.

## 4. Growth Notes

- The reference post succeeded because it demonstrated a concrete utility in under 11 seconds with zero fluff.
- The phrase "slop detector" immediately taps into universal user frustration with synthetic engagement bait on social media.
- Launch positioning must emphasize:
  - Speed: Instantaneous evaluation during scroll.
  - Cost: Extremely cheap System One scoring ($0.042/Mtok).
  - Safety: Additive non-destructive badges, never hiding posts.
  - Open and inspectable: Transparent score percentages.
