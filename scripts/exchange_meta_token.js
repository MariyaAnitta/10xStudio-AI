import 'dotenv/config';

const shortLivedToken = process.argv[2];

if (!shortLivedToken) {
  console.error('\n❌ Please provide a short-lived token as an argument!');
  console.log('Usage: node scripts/exchange_meta_token.js <YOUR_SHORT_LIVED_TOKEN>\n');
  process.exit(1);
}

const appId = process.env.META_APP_ID;
const appSecret = process.env.META_APP_SECRET;

if (!appId || !appSecret) {
  console.error('\n❌ META_APP_ID or META_APP_SECRET is missing from your .env file!');
  console.log('Please add them to your .env file and try again.\n');
  process.exit(1);
}

console.log('🔄 Exchanging short-lived token for a long-lived token...');

async function exchangeToken() {
  try {
    const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('\n❌ Meta API Error:', data.error.message);
      process.exit(1);
    }

    console.log('\n✅ Success! Here is your long-lived token (valid for ~60 days):\n');
    console.log('--------------------------------------------------');
    console.log(data.access_token);
    console.log('--------------------------------------------------');
    console.log('\n👉 Next steps:');
    console.log('1. Copy the token above');
    console.log('2. Replace the META_ACCESS_TOKEN value in your .env file with this new token');
    console.log('3. Restart your server if running locally\n');

  } catch (err) {
    console.error('\n❌ Request failed:', err);
  }
}

exchangeToken();
