from google.cloud import firestore
from configs.gemini_client import create_gemini_client
from configs.settings import DATABASE_NAME

client, credentials = create_gemini_client()

db = firestore.Client(
    project=credentials.project_id,
    credentials=credentials,
    database=DATABASE_NAME
)