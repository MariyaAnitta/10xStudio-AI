import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Uploads a local file to Supabase Storage and returns the public URL.
 * @param localFilePath Path to the local file
 * @param bucketName Name of the Supabase bucket (e.g., 'images')
 * @param destinationPath Path inside the bucket
 */
export async function uploadToSupabaseStorage(
  localFilePath: string,
  bucketName: string,
  destinationPath: string
): Promise<string> {
  const fileBuffer = fs.readFileSync(localFilePath);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(destinationPath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(destinationPath);

  return publicUrlData.publicUrl;
}
