import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

def create_supabase_client():
    """
    Initializes Supabase client using environment variables.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        print("Warning: SUPABASE_URL or SUPABASE_KEY not found in .env")
        return None
        
    try:
        supabase: Client = create_client(url, key)
        return supabase
    except Exception as e:
        print(f"Supabase Init Error: {e}")
        return None

# Singleton instance
supabase = create_supabase_client()
