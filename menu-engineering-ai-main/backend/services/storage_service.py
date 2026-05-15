import os
from database.supabase_client import supabase
from configs.settings import SUPABASE_BUCKET

def upload_image_to_supabase(file_path: str, destination_path: str = None):
    """
    Uploads a local image to Supabase Storage and returns the public URL.
    """
    if not supabase:
        print("Error: Supabase client not initialized")
        return None
        
    if not destination_path:
        destination_path = os.path.basename(file_path)
        
    try:
        with open(file_path, "rb") as f:
            supabase.storage.from_(SUPABASE_BUCKET).upload(
                path=destination_path,
                file=f,
                file_options={"upsert": "true", "content-type": "image/png"} # Default to PNG
            )
            
        # Get public URL
        url_response = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(destination_path)
        return url_response
    except Exception as e:
        print(f"Supabase Upload Error: {e}")
        return None
