import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

client = MongoClient(MONGO_URI)

db = client["AI_Ticket_Routing"]

customers_collection = db["customers"]
employees_collection = db["employees"]
tickets_collection = db["tickets"]
notifications_collection = db["notifications"]

print("MongoDB connection initialized successfully.")