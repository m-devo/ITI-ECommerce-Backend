import 'dotenv/config';

const paymob = {
        apiKey: process.env.PAYMOB_API_KEY,
        integrationId: process.env.PAYMOB_INTEGRATION_ID,
        iframeId: process.env.PAYMOB_IFRAME_ID,
        hmacSecret: process.env.PAYMOB_HMAC_SECRET,
};

export default paymob;