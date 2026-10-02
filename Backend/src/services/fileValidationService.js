const multer = require('multer');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const yauzl = require('yauzl');
const tar = require('tar-stream');

const UPLOAD_TEMP_DIR = path.join(__dirname, '../../scratch/tmp_uploads');

if (!fs.existsSync(UPLOAD_TEMP_DIR)) {
  fs.mkdirSync(UPLOAD_TEMP_DIR, { recursive: true });
}

// Multer Disk Storage setup with server-controlled filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_TEMP_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = `upload_${crypto.randomUUID()}_${Date.now()}${path.extname(file.originalname).toLowerCase()}`;
    cb(null, uniqueName);
  }
});

// Multer Config with 50 MB limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB limit
  }
});

/**
 * Checks magic bytes of the temporary file on disk against expected documentType
 */
async function validateFileMagicBytes(filePath, documentType, originalName) {
  const ext = path.extname(originalName).toLowerCase();

  // RAR format is explicitly excluded
  if (ext === '.rar') {
    throw new Error('RAR archive format is not supported. Please use ZIP, TAR, or 7Z.');
  }

  // Read initial 512 bytes buffer from disk
  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(512);
  const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
  fs.closeSync(fd);

  if (bytesRead < 4) {
    throw new Error('Uploaded file is empty or corrupted.');
  }

  // Header signatures
  const isPDF = buffer.slice(0, 4).toString('utf8') === '%PDF';
  const isZipOrPptx = buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04; // PK\x03\x04
  const isOlePpt = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0; // OLE header
  const is7z = buffer[0] === 0x37 && buffer[1] === 0x7a && buffer[2] === 0xbc && buffer[3] === 0xaf; // 7z\xBC\xAF
  const isTar = buffer.slice(257, 262).toString('utf8') === 'ustar';

  switch (documentType) {
    case 'FINAL_REPORT':
    case 'APPROVAL_CERTIFICATE':
    case 'PLAGIARISM_REPORT':
    case 'POSTER':
      if (!isPDF || ext !== '.pdf') {
        throw new Error(`File content signature does not match PDF for ${documentType}. Required .pdf format.`);
      }
      break;

    case 'PRESENTATION':
      if (!(isZipOrPptx || isOlePpt) || !['.ppt', '.pptx'].includes(ext)) {
        throw new Error('File content signature does not match PPT/PPTX presentation structure.');
      }
      break;

    case 'SOURCE_CODE':
      if (['.zip'].includes(ext)) {
        if (!isZipOrPptx) throw new Error('File signature does not match valid ZIP archive.');
        await validateZipSlipNoExtract(filePath);
      } else if (['.tar', '.gz', '.tgz'].includes(ext)) {
        if (!isTar && ext === '.tar') throw new Error('File signature does not match valid TAR archive.');
        await validateTarSlipNoExtract(filePath);
      } else if (['.7z'].includes(ext)) {
        if (!is7z) throw new Error('File signature does not match valid 7Z archive.');
      } else {
        throw new Error('Source code must be packaged as a ZIP, TAR, or 7Z archive.');
      }
      break;

    default:
      break;
  }

  return true;
}

/**
 * Inspects ZIP entry paths without extracting untrusted contents (Zip Slip prevention)
 */
function validateZipSlipNoExtract(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(new Error('Malformed or corrupted ZIP archive.'));

      zipfile.readEntry();
      zipfile.on('entry', (entry) => {
        const rawFileName = entry.fileName;
        const normalized = path.posix.normalize(rawFileName.replace(/\\/g, '/'));

        if (
          normalized.startsWith('../') ||
          normalized.includes('/../') ||
          path.isAbsolute(rawFileName) ||
          /^[a-zA-Z]:/.test(rawFileName)
        ) {
          zipfile.close();
          return reject(new Error(`Security Alert: Zip Slip path traversal detected in entry "${rawFileName}".`));
        }

        zipfile.readEntry();
      });

      zipfile.on('end', () => resolve(true));
      zipfile.on('error', (e) => reject(new Error('Corrupted ZIP archive reading entries: ' + e.message)));
    });
  });
}

/**
 * Inspects TAR entry paths without extracting untrusted contents (Tar Slip prevention)
 */
function validateTarSlipNoExtract(filePath) {
  return new Promise((resolve, reject) => {
    const extract = tar.extract();
    const readStream = fs.createReadStream(filePath);

    extract.on('entry', (header, stream, next) => {
      const rawFileName = header.name;
      const normalized = path.posix.normalize(rawFileName.replace(/\\/g, '/'));

      if (
        normalized.startsWith('../') ||
        normalized.includes('/../') ||
        path.isAbsolute(rawFileName) ||
        /^[a-zA-Z]:/.test(rawFileName)
      ) {
        readStream.destroy();
        return reject(new Error(`Security Alert: Tar Slip path traversal detected in entry "${rawFileName}".`));
      }

      stream.on('end', () => next());
      stream.resume();
    });

    extract.on('finish', () => resolve(true));
    extract.on('error', (e) => reject(new Error('Corrupted TAR archive reading entries: ' + e.message)));

    readStream.pipe(extract);
  });
}

/**
 * Deletes a temporary file safely
 */
function cleanTempFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('[FileValidationService] Could not unlink temp file:', filePath, e.message);
    }
  }
}

module.exports = {
  upload,
  validateFileMagicBytes,
  cleanTempFile,
  UPLOAD_TEMP_DIR
};
