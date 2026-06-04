import os
import sys
import json
from google import genai

def list_available_models():
    """Lists all models available in the current Vertex AI project."""
    try:
        service_account_path = os.path.join(os.getcwd(), 'service-account.json')
        if os.path.exists(service_account_path):
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
            with open(service_account_path, 'r') as f:
                service_account = json.load(f)
                project_id = service_account['project_id']
            
            client = genai.Client(vertexai=True, project=project_id, location='us-central1')
            print(f"--- Available Models in Project: {project_id} ---")
            for model in client.models.list():
                print(f"Model ID: {model.name}")
        else:
            print("Error: service-account.json not found.")
    except Exception as e:
        print(f"Discovery Error: {e}")

if __name__ == "__main__":
    list_available_models()
