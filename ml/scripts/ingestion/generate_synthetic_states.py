import pandas as pd
import numpy as np

# List of all Indian States and Union Territories (with a major city)
locations = [
    ("Andhra Pradesh", "Visakhapatnam"), ("Arunachal Pradesh", "Itanagar"), 
    ("Assam", "Guwahati"), ("Bihar", "Patna"), ("Chhattisgarh", "Raipur"),
    ("Goa", "Panaji"), ("Gujarat", "Ahmedabad"), ("Haryana", "Gurugram"),
    ("Himachal Pradesh", "Shimla"), ("Jharkhand", "Ranchi"), ("Karnataka", "Bengaluru"),
    ("Kerala", "Kochi"), ("Madhya Pradesh", "Indore"), ("Maharashtra", "Mumbai"),
    ("Manipur", "Imphal"), ("Meghalaya", "Shillong"), ("Mizoram", "Aizawl"),
    ("Nagaland", "Kohima"), ("Odisha", "Bhubaneswar"), ("Punjab", "Amritsar"),
    ("Rajasthan", "Jaipur"), ("Sikkim", "Gangtok"), ("Tamil Nadu", "Chennai"),
    ("Telangana", "Hyderabad"), ("Tripura", "Agartala"), ("Uttar Pradesh", "Lucknow"),
    ("Uttarakhand", "Dehradun"), ("West Bengal", "Kolkata"),
    ("Andaman and Nicobar Islands", "Port Blair"), ("Chandigarh", "Chandigarh"),
    ("Dadra and Nagar Haveli and Daman and Diu", "Daman"), ("Delhi", "New Delhi"),
    ("Jammu and Kashmir", "Srinagar"), ("Ladakh", "Leh"), ("Lakshadweep", "Kavaratti"),
    ("Puducherry", "Puducherry")
]

# Generate synthetic hotel data
synthetic_data = []
for state, city in locations:
    # Skip Delhi as we already have data
    if state == "Delhi":
        continue
    
    for i in range(1, 6):  # Generate 5 hotels per state
        synthetic_data.append({
            'hotel_name': f"Synthetic {city} Hotel {i}",
            'city': city,
            'province': state,
            'country': 'India',
            'latitude': np.random.uniform(8, 37),
            'longitude': np.random.uniform(68, 97),
            'review_text': f"Great stay in {city}, {state}!",
            'rating': np.random.uniform(3, 5),
            'data_source': 'Synthetic_Generator'
        })

df = pd.DataFrame(synthetic_data)
df.to_csv('data/datasets/synthetic_indian_hotel_data.csv', index=False)
print("Synthetic data generated for all states/UTs.")
