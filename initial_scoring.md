# TripOn 2.0 - Initial Scoring and Database Q&A

Below is a detailed transcript of the architectural and technical conversation regarding how TripOn 2.0 handles initial review scoring, VADER sentiment analysis, and database decisions.

---

## 1. How were the initial scores corresponding to the 7 metrics (food, cleanliness, service, wifi, location, noise, safety) assigned?

The initial scores for the 7 metrics were assigned using a **Rule-Based Aspect-Based Sentiment Analysis (ABSA)** approach powered by the `vaderSentiment` library. 

Here is the exact step-by-step process used in the `extract_aspects.py` script:

1. **Keyword Mapping**: Each of the 7 aspects was assigned a specific list of keywords. For example:
   - **Cleanliness**: `["clean", "dirty", "stain", "dust", "spot", "bathroom", "shower", "linen", "towel", "smell", "hygiene", "tidy"]`
   - **Wifi**: `["wifi", "internet", "connection", "signal", "slow", "fast", "speed", "network"]`
   
2. **Sentence Tokenization**: The raw text of each hotel review was converted to lowercase and split into individual sentences.

3. **Aspect Matching**: The system iterates over every sentence. If a sentence contains any keyword related to an aspect, it is flagged as relevant to that aspect.

4. **Sentiment Polarity Scoring**: For each relevant sentence, the `vaderSentiment` analyzer calculates a `compound` sentiment score. VADER’s compound score typically ranges from `-1` (extremely negative) to `1` (extremely positive).

5. **Scale Conversion**: To make the score fit a standard 1-to-10 rating scale, the compound score is converted using the following mathematical formula:
   ```python
   score_10 = round(((compound_score + 1) / 2) * 9 + 1, 1)
   ```
   *(For example, a neutral `0` becomes a `5.5`, and a perfect `1` becomes a `10.0`).*

6. **Averaging**: If a single review contains multiple sentences talking about the same aspect (e.g., three sentences talking about the food), the system averages those 1-to-10 scores to get a single, final score for that aspect.

7. **Storage**: The calculated aspect scores for the review are then saved into the `sentiment_json` column of the `reviews` table in the PostgreSQL database.

---

## 2. Is this done for every review, and is the hotel average then taken? What goes into VADER, its internal working, and its output?

**Yes, it is done for every single review.** 
The system first runs the NLP script on all thousands of raw reviews in the database. Every individual review gets its own JSON object containing the scores for the aspects it mentioned. 

Once all reviews are processed, a second script (`aggregate_scores.py`) runs a powerful SQL query (using Common Table Expressions) that:
1. **Groups** all the processed reviews by `hotel_id`.
2. **Calculates the mathematical average** (using SQL `AVG()`) for each of the 7 metrics across all reviews belonging to that hotel. 
3. Updates the `hotels` table with these final averaged scores, which are then used by the ranking engine.

### What input goes to VADER?
The input to VADER is **a single, isolated sentence** from a review. 
The system does not feed the entire paragraph of a review into VADER at once. Instead, it splits the review by punctuation. It checks if a sentence contains a target keyword (like "wifi" or "slow"). If it does, *only that specific sentence* is passed into VADER as a plain text string.

### What is VADER and how does it work internally?
**VADER** (Valence Aware Dictionary and sEntiment Reasoner) is a lightweight, rule-based sentiment analysis engine. It does not use machine learning or neural networks; instead, it relies on human-curated linguistic rules.

**Internal Working:**
- **Lexicon Dictionary:** It has a massive built-in dictionary of words, where each word is assigned a specific sentiment value (e.g., "terrible" might be `-2.1`, "okay" might be `0.5`, "amazing" might be `2.9`).
- **Contextual Rules:** It doesn't just look at isolated words; it understands grammar and syntax heuristics:
  - **Punctuation & Capitalization:** "The food was GOOD!!!" gets a much higher positive score than "The food was good."
  - **Degree Modifiers:** It understands adverbs. "The wifi was *extremely* slow" is scored more negatively than "The wifi was slow."
  - **Negation:** It understands that words like "not" flip the sentiment.
  - **Conjunctions:** It understands words like "but" shift the focus.

### What output does VADER give?
When VADER processes a sentence, its `polarity_scores()` function outputs a dictionary containing four values (pos, neu, neg, and compound). TripOn 2.0 specifically uses the **`compound`** score (ranging from -1 to +1) and mathematically maps it to a standard **1 to 10 scale**.

---

## 3. If VADER is not a neural network, how is it architected and how did it learn? Provide a full review example.

### How VADER "Learned"
VADER is **Lexicon and Rule-Based**. It didn't "learn" via training on massive datasets like a neural network. 

**The Lexicon (Dictionary):**
Researchers compiled a list of over 7,500 lexical features. They then used human raters to score each word on a scale from `-4` (Extremely Negative) to `+4` (Extremely Positive).

**The Heuristics (Rules):**
The developers hardcoded linguistic rules that alter these base scores based on context (e.g., Exclamation points increase intensity, "but" shifts polarity).

### A Full Example in TripOn 2.0
Let's take a raw hotel review:
> *"The room was incredibly clean! But the wifi was very slow. Service was just okay."*

#### Step A: Sentence Splitting & Keyword Matching
1. **"the room was incredibly clean!"** (Match: "clean" -> Cleanliness)
2. **"but the wifi was very slow."** (Match: "wifi", "slow" -> Wifi)
3. **"service was just okay."** (Match: "service" -> Service)

#### Step B: VADER Scoring
**Sentence 1 (Cleanliness):**
- VADER sees "clean" (+), applies modifier rule ("incredibly"), applies punctuation rule ("!").
- Outputs a **Compound Score of `+0.75`**.
- *TripOn Conversion:* `((0.75 + 1) / 2) * 9 + 1` = **8.9 out of 10**.

**Sentence 2 (Wifi):**
- VADER sees "slow" (-), applies modifier rule ("very"), applies conjunction rule ("But").
- Outputs a **Compound Score of `-0.55`**.
- *TripOn Conversion:* `((-0.55 + 1) / 2) * 9 + 1` = **3.0 out of 10**.

**Sentence 3 (Service):**
- VADER sees "okay" (+).
- Outputs a **Compound Score of `+0.22`**.
- *TripOn Conversion:* `((0.22 + 1) / 2) * 9 + 1` = **6.5 out of 10**.

#### The Final Output & Usage
The script combines these scores into a single JSON object for that specific review:
```json
{
  "cleanliness": 8.9,
  "wifi": 3.0,
  "service": 6.5
}
```
This JSON object is inserted into the `sentiment_json` column of the `reviews` table. Later, `aggregate_scores.py` averages these scores across all reviews for a hotel to create the final `wifi_score`, `cleanliness_score`, etc.

---

## 4. How are the sentences separated? What are the alternatives to VADER, and how do they compare?

### Sentence Separation
In the `extract_aspects.py` script, the sentences are separated using Python's Regular Expressions (`re`) module:
```python
sentences = re.split(r'[.!?]+', text)
```
This tells the script to split the text every time it encounters one or more periods, exclamation marks, or question marks.

### Alternatives to VADER

#### Alternative A: TextBlob (Rule-Based)
* **Pros:** Easier API, provides a "subjectivity" score.
* **Cons:** TextBlob's dictionary is generalized for formal text. VADER was specifically designed for social media and online reviews and handles slang, ALL CAPS, and emojis much better.

#### Alternative B: Transformer Neural Networks (e.g., RoBERTa, BERT)
* **Accuracy (The Winner - BERT):** Neural networks completely crush VADER in accuracy. They understand context and handle sarcasm and implicit sentiment perfectly.
* **Speed & Cost (The Winner - VADER):** Deep learning models are massive. Running a BERT model on 150,000 hotel reviews would take hours, require gigabytes of RAM, and need a GPU. VADER requires almost zero RAM and processes tens of thousands of reviews in seconds on a basic CPU, perfectly fitting TripOn 2.0's strict resource constraints.

---

## 5. Why did we use SQL instead of NoSQL?

Based on the architecture of TripOn 2.0, choosing a relational SQL database (PostgreSQL) over a NoSQL database (like MongoDB) was a strategic decision:

1. **The "Killer Feature": pgvector & Hybrid Search**
   In NoSQL, we would need a separate Vector Database (like Pinecone) for similarity search and a separate NoSQL DB for document storage, adding latency and cost. By using the `pgvector` extension in Postgres, we store our high-dimensional AI vectors in the exact same table as our relational text data. This allows us to perform **Hybrid Searches** (Vector Similarity + Traditional Filtering) in a single, blazing-fast query.

2. **The Data is Inherently Relational**
   The hierarchy of Locations -> Hotels -> Reviews perfectly fits a relational model. In NoSQL, embedding reviews into hotel documents would massively bloat document sizes, while keeping them separate would require slow application-level joins. SQL's native `JOIN` operations and foreign keys handle this elegantly.

3. **High-Speed Aggregations**
   The system calculates mathematical averages across hundreds of thousands of reviews. SQL handles this effortlessly using Common Table Expressions (CTEs) and the `GROUP BY` clause. Doing this in NoSQL requires complex aggregation pipelines.

4. **Strict Schema Enforcement**
   SQL enforces a strict schema, ensuring a review cannot be inserted if it references a non-existent hotel, which prevents bugs in downstream AI pipelines.

---

## 6. Where is the review score stored before it is grouped by hotel ID?

1. **Saving the Individual Review Score:** The script `extract_aspects.py` pushes the JSON object back into **Supabase**. It runs an `UPDATE` on the `reviews` table, storing the JSON in a column named `sentiment_json` for that specific review's row.
2. **Grouping and Averaging:** The second script (`aggregate_scores.py`) sends a single SQL query directly to Supabase. The database engine groups all reviews by `hotel_id` and calculates the averages natively.
3. **Saving Final Averages:** The SQL query immediately takes those calculated averages and writes them directly into the **`hotels`** table in Supabase.

---

## 7. How is the rating average and Trust Score calculated?

### Rating Average (`rating_avg`)
The `rating_avg` is the standard mathematical average (`AVG(rating)`) of the raw star ratings (on a 1-to-5 scale) that users left for a hotel.

### Trust Score (`trust_score`)
The Trust Score combines what users *clicked* (star ratings) with what they actually *wrote* (NLP sentiment analysis) to expose fake reviews. The final score is on a 1-to-5 scale.

The formula:
```sql
trust_score = (avg_rating + (sum_of_7_nlp_aspects / 14.0)) / 2.0
```

1. **The NLP Sum:** The system adds together the hotel's 7 averaged NLP aspect scores (out of 10). If a hotel has no reviews for a specific aspect, the SQL `COALESCE` function assigns a neutral baseline score of `6.0` to prevent unfair penalization.
2. **Scaling the NLP Score:** The maximum possible sum of the 7 aspects is 70. The formula divides this sum by `14.0` to mathematically convert it down to a 5-point scale (`70 / 14 = 5`).
3. **The Final Blend:** It takes the raw `avg_rating` (out of 5) and adds it to the scaled NLP score (out of 5), then divides by `2` to find the exact midpoint. 

If a hotel buys fake 5-star reviews (which are often short and generic), the NLP engine won't find rich positive sentiment. The lower NLP score will drag the overall Trust Score down, exposing the discrepancy.
