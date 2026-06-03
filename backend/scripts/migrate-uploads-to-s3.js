require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const bucket = process.env.RAILWAY_BUCKET_NAME;
const endpoint = process.env.RAILWAY_S3_ENDPOINT;
const accessKeyId = process.env.RAILWAY_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.RAILWAY_S3_SECRET_ACCESS_KEY;
const region = process.env.RAILWAY_S3_REGION || 'us-east-1';
const publicUrl = process.env.RAILWAY_S3_PUBLIC_URL;

if (!bucket || !endpoint || !accessKeyId || !secretAccessKey) {
    console.error('Faltan variables de entorno S3. Revisa .env');
    process.exit(1);
}

const s3 = new S3Client({
    region,
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
});

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    console.error('No se encontró la carpeta uploads en', uploadsDir);
    process.exit(1);
}

const allowedExt = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.pdf'];

(async () => {
    const files = fs.readdirSync(uploadsDir).filter(f => {
        const stat = fs.statSync(path.join(uploadsDir, f));
        return stat.isFile() && allowedExt.includes(path.extname(f).toLowerCase());
    });

    if (!files.length) {
        console.log('No hay archivos válidos para subir en', uploadsDir);
        process.exit(0);
    }

    console.log(`Found ${files.length} files. Starting upload...`);
    const results = [];

    for (const filename of files) {
        const filePath = path.join(uploadsDir, filename);
        const body = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.gif') contentType = 'image/gif';
        else if (ext === '.webp') contentType = 'image/webp';
        else if (ext === '.svg') contentType = 'image/svg+xml';
        else if (ext === '.bmp') contentType = 'image/bmp';
        else if (ext === '.tiff') contentType = 'image/tiff';

        const key = `uploads/${filename}`; // preserve filename inside uploads/
        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentType,
            ACL: 'public-read',
        });

        try {
            await s3.send(command);
            const url = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : `${endpoint.replace(/\/$/, '')}/${bucket}/${key}`;
            console.log(`Uploaded ${filename} -> ${url}`);
            results.push({ filename, url, success: true });
        } catch (err) {
            console.error(`Error uploading ${filename}:`, err.message || err);
            results.push({ filename, error: err.message || String(err), success: false });
        }
    }

    const summary = { total: files.length, uploaded: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, details: results };
    const outPath = path.join(process.cwd(), 'uploads-migration-report.json');
    fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
    console.log('Done. Report saved to', outPath);
})();
