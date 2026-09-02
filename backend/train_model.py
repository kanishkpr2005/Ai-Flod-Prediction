import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle

# Load dataset
data = pd.read_csv("disaster_dataset.csv")

# Input and output
X = data["text"]
y = data["disaster_type"]

# Convert text into numbers
vectorizer = TfidfVectorizer()
X_vectorized = vectorizer.fit_transform(X)

# Train model
model = LogisticRegression()
model.fit(X_vectorized, y)

# Save model and vectorizer
with open("disaster_model.pkl", "wb") as f:
    pickle.dump((vectorizer, model), f)

print("Model trained successfully!")