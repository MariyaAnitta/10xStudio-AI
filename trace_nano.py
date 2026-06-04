import os
import sys
import json
from google import genai

def deep_trace_nano():
    """Tries multiple API versions and formats to find the working call for 2.5."""
    try:
        service_account_path = os.path.join(os.getcwd(), 'service-account.json')
        if not os.path.exists(service_account_path):
            print("Error: service-account.json not found.")
            return

        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = service_account_path
        with open(service_account_path, 'r') as f:
            service_account = json.load(f)
            project_id = service_account['project_id']
        
        # Test configurations
        configs = [
            {'ver': 'v1alpha', 'name': 'publishers/google/models/gemini-2.5-flash-image'},
            {'ver': 'v1beta', 'name': 'publishers/google/models/gemini-2.5-flash-image'},
            {'ver': 'v1', 'name': 'publishers/google/models/gemini-2.5-flash-image'},
            {'ver': 'v1beta', 'name': 'gemini-2.5-flash-image'}
        ]
        
        print(f"--- Deep Trace: Gemini 2.5 in us-east1 ---")
        
        for config in configs:
            try:
                print(f"Testing {config['ver']} with name: {config['name']}...", end=" ")
                client = genai.Client(vertexai=True, project=project_id, location='us-east1', http_options={'api_version': config['ver']})
                # Simple check to see if model is reachable
                client.models.get(model=config['name'])
                print("SUCCESS!")
                return config
            except Exception as e:
                print(f"FAILED: {str(e)[:100]}...")
                
    except Exception as e:
        print(f"Trace Error: {e}")

if __name__ == "__main__":
    deep_trace_nano()
