require('dotenv').config();
const { S3Client, ListObjectsV2Command, PutObjectAclCommand } = require('@aws-sdk/client-s3');

const bucket = process.env.RAILWAY_BUCKET_NAME;
const endpoint = process.env.RAILWAY_S3_ENDPOINT;
const accessKeyId = process.env.RAILWAY_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.RAILWAY_S3_SECRET_ACCESS_KEY;
const region = process.env.RAILWAY_S3_REGION || 'us-east-1';
const publicUrl = process.env.RAILWAY_S3_PUBLIC_URL; // optional

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
    const publicList = [];
    for (const it of items) {
        const key = it.Key;
        try {
            const aclCmd = new PutObjectAclCommand({ Bucket: bucket, Key: key, ACL: 'public-read' });
            await s3.send(aclCmd);
            const url = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
            console.log('Made public:', key, '->', url);
            publicList.push({ key, url });
        } catch (err) {
            console.error('Error setting ACL for', key, err.message || err);
        }
    }
    const fs = require('fs');
    fs.writeFileSync('public-uploads.json', JSON.stringify(publicList, null, 2));
    console.log('Saved public-uploads.json');
})();
