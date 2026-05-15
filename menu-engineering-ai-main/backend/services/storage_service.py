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
        
    if destination_path:
        destination_path = destination_path.replace(" ", "_")
    else:
        destination_path = os.path.basename(file_path).replace(" ", "_")
        
    try:
        with open(file_path, "rb") as f:
            supabase.storage.from_(SUPABASE_BUCKET).upload(
                path=destination_path,
                file=f,
                file_options={"upsert": "true", "content-type": "image/jpeg"} # Changed to JPEG for better compatibility
            )

            
        # Get public URL
        url_response = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(destination_path)
        
        # Ensure we return a string URL, not a response object
        if hasattr(url_response, 'public_url'):
            return url_response.public_url
        return str(url_response)

    except Exception as e:
        print(f"Supabase Upload Error: {e}")
        return None
