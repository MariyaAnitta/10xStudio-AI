const { Storage } = require('@google-cloud/storage');
const path = require('path');

const storage = new Storage({
  keyFilename: path.join(__dirname, 'service-account.json'),
});

const bucketName = '10xstudio-ai';

async function configureBucketCors() {
  const bucket = storage.bucket(bucketName);

  const corsConfiguration = [
    {
      maxAgeSeconds: 3600,
      method: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      origin: ['*'], // Allow all origins for the app
      responseHeader: ['*'], // Allow all headers
    },
  ];

  try {
    await bucket.setCorsConfiguration(corsConfiguration);
    console.log(`Bucket ${bucketName} was updated with a CORS config to allow all origins.`);
  } catch (error) {
    console.error(`Failed to set CORS on ${bucketName}:`, error);
  }
}

configureBucketCors();
