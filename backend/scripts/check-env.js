require('dotenv').config();
console.log('RAILWAY_BUCKET_NAME=', process.env.RAILWAY_BUCKET_NAME);
console.log('RAILWAY_S3_ENDPOINT=', process.env.RAILWAY_S3_ENDPOINT);
console.log('RAILWAY_S3_ACCESS_KEY_ID=', process.env.RAILWAY_S3_ACCESS_KEY_ID ? '***present***' : 'MISSING');
console.log('RAILWAY_S3_SECRET_ACCESS_KEY=', process.env.RAILWAY_S3_SECRET_ACCESS_KEY ? '***present***' : 'MISSING');
console.log('PORT=', process.env.PORT || 'not set');
