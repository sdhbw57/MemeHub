const crypto = require('crypto');

const SECRET_KEY = process.env.URL_SECRET || 'tuzhan-image-hosting-2024';

function encryptUrl(imageId) {
    const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        crypto.scryptSync(SECRET_KEY, 'salt', 32),
        Buffer.alloc(16, 0)
    );
    let encrypted = cipher.update(imageId, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decryptUrl(encryptedId) {
    try {
        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            crypto.scryptSync(SECRET_KEY, 'salt', 32),
            Buffer.alloc(16, 0)
        );
        let decrypted = decipher.update(encryptedId, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch {
        return null;
    }
}

function generateToken() {
    return crypto.randomBytes(16).toString('hex');
}

function hashImageId(imageId) {
    return crypto
        .createHash('sha256')
        .update(imageId + SECRET_KEY)
        .digest('hex')
        .substring(0, 16);
}

module.exports = {
    encryptUrl,
    decryptUrl,
    generateToken,
    hashImageId,
};
