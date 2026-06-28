import os
import sys
import json
import traceback
import time
from google import genai

def generate_video(prompt, output_filename):
    try:
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'service-account.json'
        client = genai.Client(vertexai=True, project='tenxds-agents-idp', location='us-central1')
        
        # Start the video generation
        operation = client.models.generate_videos(
            model='veo-2.0-generate-001',
            prompt=prompt,
        )
        
        operation_name = operation.name
        
        # Poll the operation until it's done
        # Veo usually takes 1-3 minutes
        poll_interval = 10
        max_attempts = 36 # 6 minutes max
        
        for _ in range(max_attempts):
            op_status = client.operations.get(operation)
            if op_status.done:
                break
            time.sleep(poll_interval)
            
        if not op_status.done:
            return {"success": False, "error": "Video generation timed out"}
            
        if getattr(op_status, 'error', None):
            return {"success": False, "error": str(op_status.error)}
            
        # Extract the video bytes from the completed operation
        # Depending on the SDK, the result is in op_status.result or op_status.response
        result = getattr(op_status, 'result', None) or getattr(op_status, 'response', None)
        
        if getattr(result, 'generated_videos', None):
            gen_vid = result.generated_videos[0]
        else:
            gen_vid = result
            
        video_obj = getattr(gen_vid, 'video', gen_vid)
        video_bytes = getattr(video_obj, 'video_bytes', None) or getattr(video_obj, 'bytes', None) or getattr(gen_vid, 'video_bytes', None)
            
        if video_bytes:
            output_path = os.path.join('localvideos', output_filename)
            with open(output_path, 'wb') as f:
                f.write(video_bytes)
                
            return {
                "success": True, 
                "filename": output_filename,
                "url": f"/videos/{output_filename}"
            }
        else:
            return {"success": False, "error": "No video bytes found in operation result"}
            
    except Exception as e:
        error_trace = traceback.format_exc()
        return {"success": False, "error": str(e), "trace": error_trace}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing prompt or output filename argument"}))
        sys.exit(1)
        
    prompt = sys.argv[1]
    output_filename = sys.argv[2]
    
    result = generate_video(prompt, output_filename)
    print(json.dumps(result))
