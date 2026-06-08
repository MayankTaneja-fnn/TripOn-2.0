"""
TripOn 2.0 - Data Consolidation Pipeline
Processes one dataset at a time, appends to CSV, frees memory immediately.
Uses vectorized pandas ops (fast) but never holds more than one dataset in RAM.
"""
import pandas as pd
import numpy as np
import os
import gc
import re

BASE = "C:/Users/tanej/OneDrive/Desktop/TripOn2.0"
OUT_REVIEWS = os.path.join(BASE, "tripon_reviews_master.csv")
OUT_HOTELS = os.path.join(BASE, "tripon_hotels_master.csv")

# Pre-compiled regex
WIFI_RE = re.compile(r'\b(wifi|wi-fi|internet|wlan|connection|speed|signal|network)\b', re.I)
CLEAN_RE = re.compile(r'\b(clean|dirty|spotless|dust|hygiene|tidy|neat|smell|odor|filthy|bedbugs|sheets|bathroom|towels|maid)\b', re.I)
FOOD_RE = re.compile(r'\b(food|breakfast|dinner|lunch|restaurant|eat|meal|buffet|delicious|menu|bar|drink|coffee)\b', re.I)
SERVICE_RE = re.compile(r'\b(staff|service|friendly|helpful|reception|manager|host|hospitality|polite|rude|welcoming|clerk)\b', re.I)
SAFETY_RE = re.compile(r'\b(safe|secure|danger|neighborhood|lock|guard|police|scam|rob|theft)\b', re.I)
LOCATION_RE = re.compile(r'\b(location|close to|near|distance|metro|subway|station|convenient|walk|center|downtown|surrounding)\b', re.I)

FINAL_COLS = [
    "hotel_name","city","province","country","address","latitude","longitude",
    "review_title","review_text","rating_10_scale","review_date","source_dataset",
    "room_type","traveler_type","stay_length","positive_review","negative_review",
    "reviewer_name","review_length","sentiment_hint",
    "contains_wifi_keywords","contains_cleanliness_keywords","contains_food_keywords",
    "contains_service_keywords","contains_safety_keywords","contains_location_keywords"
]

SCALE_5 = {"Datafiniti_Main","Datafiniti_Jun19","Datafiniti_Standard","TripAdvisor"}

def process_source(path, source_name, col_map, defaults=None):
    """Load one dataset, transform it, return a cleaned DataFrame with FINAL_COLS."""
    print(f"  Loading {source_name}...", flush=True)
    df = pd.read_csv(os.path.join(BASE, path), low_memory=False)
    df = df.rename(columns=col_map)

    if defaults:
        for c, v in defaults.items():
            if c not in df.columns:
                df[c] = v

    # La Veranda: combine positive + negative
    if source_name == "La_Veranda":
        df["positive_review"] = df["positive_review"].fillna("").astype(str).str.strip()
        df["negative_review"] = df["negative_review"].fillna("").astype(str).str.strip()
        df["review_text"] = (df["positive_review"] + " " + df["negative_review"]).str.strip()

    # Ensure all final columns exist
    for c in FINAL_COLS:
        if c not in df.columns:
            if c in ("latitude","longitude","rating_10_scale","review_length"):
                df[c] = 0.0
            elif c.startswith("contains_"):
                df[c] = 0
            else:
                df[c] = ""

    df["source_dataset"] = source_name

    # Clean text
    df["review_text"] = df["review_text"].fillna("").astype(str).str.replace(r'<[^>]*>', '', regex=True).str.replace(r'\s+', ' ', regex=True).str.strip()
    df["review_title"] = df["review_title"].fillna("").astype(str).str.strip()

    # Drop empty reviews
    df = df[df["review_text"].str.len() > 0].copy()

    # String cleanup
    for c in ["hotel_name","city","province","country","address"]:
        df[c] = df[c].fillna("Unknown").astype(str).str.strip()
        df[c] = df[c].replace({"":"Unknown","nan":"Unknown","None":"Unknown"})

    df["reviewer_name"] = df["reviewer_name"].fillna("Anonymous").astype(str).str.strip()
    df["review_date"] = df["review_date"].fillna("").astype(str).str.strip()

    for c in ["room_type","traveler_type","stay_length"]:
        df[c] = df[c].fillna("Unknown").astype(str).str.strip()

    for c in ["positive_review","negative_review"]:
        df[c] = df[c].fillna("").astype(str).str.strip()

    # Coordinates
    df["latitude"] = pd.to_numeric(df["latitude"], errors="coerce").fillna(0.0)
    df["longitude"] = pd.to_numeric(df["longitude"], errors="coerce").fillna(0.0)

    # Rating normalization
    df["rating_10_scale"] = pd.to_numeric(df.get("rating", df.get("rating_10_scale", 5.0)), errors="coerce").fillna(5.0)
    if source_name in SCALE_5:
        df["rating_10_scale"] = df["rating_10_scale"] * 2.0
    df["rating_10_scale"] = df["rating_10_scale"].clip(0.0, 10.0).round(1)

    # Derived features (vectorized)
    df["review_length"] = df["review_text"].str.split().str.len()
    df["sentiment_hint"] = np.where(df["rating_10_scale"] >= 7.0, "positive",
                            np.where(df["rating_10_scale"] <= 4.0, "negative", "neutral"))

    df["contains_wifi_keywords"] = df["review_text"].str.contains(WIFI_RE).astype(int)
    df["contains_cleanliness_keywords"] = df["review_text"].str.contains(CLEAN_RE).astype(int)
    df["contains_food_keywords"] = df["review_text"].str.contains(FOOD_RE).astype(int)
    df["contains_service_keywords"] = df["review_text"].str.contains(SERVICE_RE).astype(int)
    df["contains_safety_keywords"] = df["review_text"].str.contains(SAFETY_RE).astype(int)
    df["contains_location_keywords"] = df["review_text"].str.contains(LOCATION_RE).astype(int)

    # Select final columns only
    df = df[FINAL_COLS]
    print(f"  -> {len(df)} rows processed from {source_name}", flush=True)
    return df

def main():
    print("=== TripOn 2.0 Data Consolidation ===", flush=True)

    sources = [
        ("archive/Hotel Reviews.csv", "Datafiniti_Main",
         {"name":"hotel_name","city":"city","country":"country","address":"address",
          "latitude":"latitude","longitude":"longitude","province":"province",
          "reviews.title":"review_title","reviews.text":"review_text",
          "reviews.rating":"rating","reviews.date":"review_date","reviews.username":"reviewer_name"}, None),

        ("archive (1)/7282_1.csv", "7282_1",
         {"name":"hotel_name","city":"city","country":"country","address":"address",
          "latitude":"latitude","longitude":"longitude","province":"province",
          "reviews.title":"review_title","reviews.text":"review_text",
          "reviews.rating":"rating","reviews.date":"review_date","reviews.username":"reviewer_name"}, None),

        ("archive (1)/Datafiniti_Hotel_Reviews_Jun19.csv", "Datafiniti_Jun19",
         {"name":"hotel_name","city":"city","country":"country","address":"address",
          "latitude":"latitude","longitude":"longitude","province":"province",
          "reviews.title":"review_title","reviews.text":"review_text",
          "reviews.rating":"rating","reviews.date":"review_date","reviews.username":"reviewer_name"}, None),

        ("archive (1)/Datafiniti_Hotel_Reviews.csv", "Datafiniti_Standard",
         {"name":"hotel_name","city":"city","country":"country","address":"address",
          "latitude":"latitude","longitude":"longitude","province":"province",
          "reviews.title":"review_title","reviews.text":"review_text",
          "reviews.rating":"rating","reviews.date":"review_date","reviews.username":"reviewer_name"}, None),

        ("archive (2)/tripadvisor_hotel_reviews.csv", "TripAdvisor",
         {"Review":"review_text","Rating":"rating"},
         {"hotel_name":"Unknown Hotel","city":"Unknown","country":"Unknown","address":"Unknown",
          "latitude":0.0,"longitude":0.0,"province":"Unknown","review_title":"","reviewer_name":"Anonymous","review_date":""}),

        ("archive (3)/hotel_reviews.csv", "General_Hotel_Reviews",
         {"Name":"hotel_name","Area":"city","Review_Date":"review_date",
          "Rating(Out of 10)":"rating","Review_Text":"review_text"},
         {"country":"India","address":"Unknown","latitude":0.0,"longitude":0.0,
          "province":"Unknown","review_title":"","reviewer_name":"Anonymous"}),

        ("archive (4)/La_Veranda_Reviews-2023-01-16.csv", "La_Veranda",
         {"Title":"review_title","Score":"rating","GuestName":"reviewer_name",
          "GuestCountry":"country","RoomType":"room_type","NumberOfNights":"stay_length",
          "VisitDate":"review_date","GroupType":"traveler_type",
          "PositiveReview":"positive_review","NegativeReview":"negative_review"},
         {"hotel_name":"La Veranda","city":"Unknown","address":"Unknown",
          "latitude":0.0,"longitude":0.0,"province":"Unknown"}),
    ]

    first = True
    total = 0
    seen = set()
    dupes = 0

    for path, name, col_map, defaults in sources:
        fpath = os.path.join(BASE, path)
        if not os.path.exists(fpath):
            print(f"  SKIP: {name} not found", flush=True)
            continue

        df = process_source(path, name, col_map, defaults)

        # Dedup within and across datasets
        df["_key"] = (df["hotel_name"].str.lower().str.strip() + "||" +
                       df["review_text"].str.lower().str.strip().str[:200])
        before = len(df)
        df = df[~df["_key"].isin(seen)]
        seen.update(df["_key"].tolist())
        df = df.drop(columns=["_key"])
        dupes += (before - len(df))

        # Append to CSV
        df.to_csv(OUT_REVIEWS, mode="a" if not first else "w", header=first, index=False)
        first = False
        total += len(df)

        del df
        gc.collect()

    print(f"\nTotal reviews: {total}, Duplicates removed: {dupes}", flush=True)
    print(f"Reviews file: {OUT_REVIEWS}", flush=True)

    # Hotel aggregation - read back in chunks
    print("\nBuilding hotel master...", flush=True)
    agg = {}
    for chunk in pd.read_csv(OUT_REVIEWS, usecols=["hotel_name","city","country","rating_10_scale","latitude","longitude"], chunksize=10000):
        for _, r in chunk.iterrows():
            k = (r["hotel_name"], r["city"], r["country"])
            if k not in agg:
                agg[k] = {"r":[], "lat":0.0, "lon":0.0}
            agg[k]["r"].append(r["rating_10_scale"])
            if r["latitude"] != 0.0 and agg[k]["lat"] == 0.0:
                agg[k]["lat"] = r["latitude"]
            if r["longitude"] != 0.0 and agg[k]["lon"] == 0.0:
                agg[k]["lon"] = r["longitude"]

    rows = []
    for (h,c,co), d in agg.items():
        n = len(d["r"])
        avg = round(np.mean(d["r"]), 2)
        var = round(float(np.var(d["r"], ddof=1)), 2) if n > 1 else 0.0
        vol = min(1.0, np.log10(n+1)/np.log10(100))
        con = max(0.0, 1.0 - var/16.0)
        trust = round(avg * vol * con, 2)
        rows.append([h,c,co,n,avg,var,round(d["lat"],6),round(d["lon"],6),trust])

    pd.DataFrame(rows, columns=["hotel_name","city","country","review_count","average_rating",
        "rating_variance","latitude","longitude","trust_score"]).to_csv(OUT_HOTELS, index=False)

    print(f"Hotels file: {OUT_HOTELS} ({len(rows)} unique hotels)", flush=True)
    print("=== Pipeline Complete ===", flush=True)

if __name__ == "__main__":
    main()
