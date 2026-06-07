export function getImageUrl(src?: string) {
    if (!src) return '';
    // If already absolute URL, return as-is
    if (/^https?:\/\//i.test(src)) return src;

    const base = (import.meta.env.VITE_UPLOADS_BASE_URL as string) || '/uploads';
    // Ensure base doesn't end with slash
    const baseClean = base.replace(/\/$/, '');

    // Normalize incoming path: remove leading slash
    const path = src.replace(/^\//, '');

    // If src already starts with uploads/, join directly
    if (/^uploads\//.test(path)) return `${baseClean}/${path.replace(/^uploads\//, 'uploads/')}`;

    // If src starts with uploads (without slash), handle
    if (/^uploads/.test(path)) return `${baseClean}/${path}`;

    // Otherwise assume it's a filename and place under uploads/
    return `${baseClean}/uploads/${path}`;
}
