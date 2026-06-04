import os
import sys
import json
from google import genai

def find_model_region():
    """Finds the supported regions for the Gemini 2.5 models."""
    try:
        service_account_path = os.path.join(os.getcwd(), 'service-account.json')
        if not os.path.exists(service_account_path):
            print("Error: service-account.json not found.")
            return

        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
        with open(service_account_path, 'r') as f:
            service_account = json.load(f)
            project_id = service_account['project_id']
        
        # We check common regions to see where the 2.5 model 'lives'
        regions = ['us-central1', 'us-east4', 'europe-west1', 'europe-west9', 'asia-northeast1']
        
        print(f"--- Searching for Nano Banana (2.5) across regions in {project_id} ---")
        
        for region in regions:
            try:
                client = genai.Client(vertexai=True, project=project_id, location=region)
                model = client.models.get(model='gemini-2.5-flash-image')
                print(f"✅ FOUND in {region}! Full Name: {model.name}")
                return region
            except Exception:
                print(f"❌ Not in {region}")
                
    except Exception as e:
        print(f"Region Discovery Error: {e}")

if __name__ == "__main__":
    find_model_region()
