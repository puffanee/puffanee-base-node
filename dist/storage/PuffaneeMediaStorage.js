import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const DEFAULT_MEDIA_STORAGE_OPTIONS = {
  base_url: "https://media.storage.puffanee.net.tr/",
  allowedFileExtensions: [".jpeg", ".jpg", ".png", ".gif", ".webp"],
  allowedFileTypes: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, "..", "..", "..", "_puffanee-temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

export class PuffaneeMediaStorage {
  /**
   * Puffanee Storage Media - Class
   *
   * @param {string} api_accesskey
   * @param {string} prefix Maybe your short app name, prefix
   */
  constructor(api_accesskey, prefix) {
    this.pf_access = api_accesskey;
    this.defaultOptions = DEFAULT_MEDIA_STORAGE_OPTIONS;
    this.systemprefix = prefix;
  }

  /**
   * Control file type is valid
   *
   * @param {string} filetype File type string
   * @returns
   */
  isValidFileType(filetype) {
    if (!DEFAULT_MEDIA_STORAGE_OPTIONS.allowedFileTypes.includes(filetype)) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Control extension is valid
   *
   * @param {string} extension Extension string
   * @returns
   */
  isValidFileExtension(extension) {
    if (
      !DEFAULT_MEDIA_STORAGE_OPTIONS.allowedFileExtensions.includes(extension)
    ) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Upload file with url or only file to Puffanee Media Storage server
   *
   * @param {*} fileOrUrl
   * @returns
   */
  async uploadFile(fileOrUrl, compress) {
    const isUrl = (str) => {
      try {
        new URL(str);
        return true;
      } catch (_) {
        return false;
      }
    };

    let localFilePath = fileOrUrl;
    let fileExtension = path.extname(fileOrUrl);
    let fileCompressed = false;

    if (isUrl(fileOrUrl)) {
      const url = new URL(fileOrUrl);
      const urlPathname = url.pathname;
      fileExtension = path.extname(urlPathname);
      const tempFilePath = path.join(
        tempDir,
        `MediaTemp-${this.systemprefix}-${Date.now()}${fileExtension}`
      );

      await axios({
        method: "get",
        url: fileOrUrl,
        responseType: "stream",
      })
        .then((response) => {
          return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(tempFilePath);
            response.data.pipe(writer);
            let error = null;
            writer.on("error", (err) => {
              error = err;
              writer.close();
              reject(err);
            });
            writer.on("close", () => {
              if (!error) {
                resolve(tempFilePath);
              }
            });
          });
        })
        .catch((error) => {
          throw error;
        });

      localFilePath = tempFilePath;
    } else {
      if (!fs.existsSync(localFilePath)) {
        return {
          success: false,
          code: "uploaderror_0",
        };
      }
    }

    if (
      !DEFAULT_MEDIA_STORAGE_OPTIONS.allowedFileExtensions.includes(
        fileExtension
      )
    ) {
      return {
        success: false,
        code: "uploaderror_1",
      };
    }

    const fileSizeInBytes = fs.statSync(localFilePath).size;
    if (fileSizeInBytes > DEFAULT_MEDIA_STORAGE_OPTIONS.maxFileSize) {
      if (compress) {
        const compressedFilePath = path.join(
          tempDir,
          `${this.systemprefix}-compressed_temp-${Date.now()}${fileExtension}`
        );

        await sharp(localFilePath)
          .resize({ fit: "inside", width: 1920, height: 1080 })
          .toFile(compressedFilePath);

        fileCompressed = true;
        localFilePath = compressedFilePath;
      } else {
        return {
          success: false,
          code: "uploaderror_2",
        };
      }
    }

    const form = new FormData();
    form.append("pf_access", this.pf_access);
    form.append("file", fs.createReadStream(localFilePath));

    try {
      const response = await axios.post(
        `${DEFAULT_MEDIA_STORAGE_OPTIONS.base_url}api/`,
        form,
        {
          headers: {
            ...form.getHeaders(),
          },
        }
      );

      const finalFileSize = fs.statSync(localFilePath).size;
      const finalFileSizeInMB = finalFileSize / (1024 * 1024);

      return {
        success: response.data.state.success,
        code: response.data.state.message_code,
        accessurl: response.data.data.fileAccessUrl,
        fileExtension: response.data.data.fileExtension,
        fileSizeInMB: finalFileSizeInMB.toFixed(2),
        fileId: response.data.data.fileId,
        fileCompressed: fileCompressed,
        localFile: localFilePath,
      };
    } catch (error) {
      if (localFilePath.includes(tempDir) && fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return {
        success: false,
        code: error,
      };
    }
  }

  /**
   * Delete media storage file
   *
   * @param {string} fileId Delete storage file id
   * @returns
   */
  async deleteFile(fileId) {
    const deleteUrl = `${DEFAULT_MEDIA_STORAGE_OPTIONS.base_url}api/${fileId}?pf_access=${this.pf_access}`;

    try {
      const response = await axios.delete(deleteUrl);

      //console.log(response);

      return {
        success: response.data.state.success,
        code: response.data.state.message_code,
      };
    } catch (error) {
      console.error(
        "[Puffanee] Media storage 'deleteFile' error: An error has occurred in delete file operation:",
        error
      );
      return {
        success: false,
        code: error.response.data.state.message_code || error.message,
      };
    }
  }

  /**
   * Get media storage file URL
   *
   * @param {string} fileId Storage file id
   * @returns
   */
  async getFileUrl(fileId) {
    const getUrl = `${DEFAULT_MEDIA_STORAGE_OPTIONS.base_url}uploaded/${fileId}`;
    return `${getUrl}`;
  }

  /**
   * Get media storage extension file URL
   *
   * @param {*} fileId
   * @param {*} extension
   * @returns
   */
  async getFileExtUrl(fileId, extension) {
    const getUrl = `${DEFAULT_MEDIA_STORAGE_OPTIONS.base_url}uploaded/${fileId}.${extension}`;
    return `${getUrl}`;
  }
}
