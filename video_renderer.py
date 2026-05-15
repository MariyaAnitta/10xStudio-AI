import sys
import os
import json
import asyncio
import time
import shutil
import subprocess
from playwright.async_api import async_playwright
import imageio_ffmpeg

async def render_video(html_content, output_path, duration=30):
    """
    Renders the provided HTML content to an MP4 file using Playwright and FFmpeg.
    """
    temp_dir = "temp_render"
    os.makedirs(temp_dir, exist_ok=True)
    
    html_file = os.path.join(temp_dir, "video.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    abs_html_path = "file://" + os.path.abspath(html_file).replace("\\", "/")
    
    async with async_playwright() as p:
        # Launch browser with video recording enabled
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            record_video_dir=temp_dir,
            record_video_size={'width': 1920, 'height': 1080}
        )
        
        page = await context.new_page()
        print(f"DEBUG: Opening {abs_html_path}", file=sys.stderr)
        
        await page.goto(abs_html_path)
        
        # Wait for GSAP animation to complete
        # We add a small buffer (2s)
        print(f"DEBUG: Recording for {duration + 2} seconds...", file=sys.stderr)
        await asyncio.sleep(duration + 2)
        
        # Close context to finalize video recording
        video_path = await page.video.path()
        await context.close()
        await browser.close()
        
        if not video_path or not os.path.exists(video_path):
            raise Exception("Playwright failed to record video")
            
        print(f"DEBUG: Recording finished. Temp video: {video_path}", file=sys.stderr)
        
        # Convert .webm to .mp4 using imageio-ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        
        # Construct FFmpeg command
        # We use -y to overwrite, -i for input, and convert to h264
        cmd = [
            ffmpeg_exe, "-y",
            "-i", video_path,
            "-c:v", "libx264",
            "-preset", "slow",
            "-crf", "22",
            "-pix_fmt", "yuv420p",
            output_path
        ]
        
        print(f"DEBUG: Converting to MP4...", file=sys.stderr)
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"FFmpeg Error: {result.stderr}", file=sys.stderr)
            raise Exception("FFmpeg conversion failed")
            
        print(f"DEBUG: Conversion complete: {output_path}", file=sys.stderr)
        
        # Cleanup temp files
        # shutil.rmtree(temp_dir)
        
        return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing arguments"}))
        sys.exit(1)
        
    # Args: html_file_path, output_mp4_path, duration
    html_path = sys.argv[1]
    output_path = sys.argv[2]
    duration = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    try:
        with open(html_path, "r", encoding="utf-8") as f:
            html_content = f.read()
            
        success = asyncio.run(render_video(html_content, output_path, duration))
        
        if success:
            print(json.dumps({
                "success": True, 
                "mp4_path": output_path,
                "filename": os.path.basename(output_path)
            }))
        else:
            print(json.dumps({"success": False, "error": "Unknown rendering error"}))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
