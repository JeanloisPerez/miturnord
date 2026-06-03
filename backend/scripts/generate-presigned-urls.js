require('dotenv').config();
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const bucket = process.env.RAILWAY_BUCKET_NAME;
const endpoint = process.env.RAILWAY_S3_ENDPOINT;
const accessKeyId = process.env.RAILWAY_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.RAILWAY_S3_SECRET_ACCESS_KEY;
const region = process.env.RAILWAY_S3_REGION || 'us-east-1';

if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    console.error('Faltan variables de entorno S3. Revisa .env');
    process.exit(1);
}

const s3 = new S3Client({ region, endpoint, credentials: { accessKeyId, secretAccessKey }, forcePathStyle: true });

(async () => {
    const listCmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: 'uploads/' });
    const res = await s3.send(listCmd);
    const items = res.Contents || [];
    if (!items.length) {
        console.log('No se encontraron objetos bajo uploads/');
        process.exit(0);
    }
    const signed = [];
    for (const it of items) {
        const key = it.Key;
        const getCmd = new GetObjectCommand({ Bucket: bucket, Key: key });
        try {
            const url = await getSignedUrl(s3, getCmd, { expiresIn: 3600 });
            console.log(key, '->', url);
            signed.push({ key, url });
        } catch (err) {
            console.error('Error presigning', key, err.message || err);
        }
    }
    const fs = require('fs');
    fs.writeFileSync('presigned-uploads.json', JSON.stringify(signed, null, 2));
    console.log('Saved presigned-uploads.json');
})();
