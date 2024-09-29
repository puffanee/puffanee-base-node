import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PuffaneeConfig {
  constructor() {
    const dbDir = path.join(__dirname, "..", "..", "_data");

    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.dbPath = path.join(dbDir, "pfn-configuration.db");

    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error("Veritabanı bağlantısı başarısız:", err.message);
      } else {
        this.db.run(
          `CREATE TABLE IF NOT EXISTS PuffaneeConfiguration (
                    row INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE,
                    data TEXT,
                    config_create DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
          (err) => {
            if (err) {
              console.error("Tablo oluşturma hatası:", err.message);
            } else {
              this.checkAndInitializeDefaultConfigs();
            }
          }
        );
      }
    });
  }

  checkAndInitializeDefaultConfigs() {
    this.db.get(
      `SELECT COUNT(*) AS count FROM PuffaneeConfiguration`,
      (err, row) => {
        if (err) {
          console.error(
            "Varsayılan yapılandırmalar kontrol edilirken hata:",
            err.message
          );
        } else if (row.count === 0) {
          this.initializeDefaultConfigs();
        }
      }
    );
  }

  initializeDefaultConfigs() {
    const defaultConfigs = [
      { key: "AppDebugState", data: false },
      { key: "AppMaintenanceState", data: false },
    ];

    defaultConfigs.forEach(async (config) => {
      await this.AddConfig(config.key, config.data);
    });
  }

  async AddConfig(CONFIG_KEY, CONFIG_DATA) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO PuffaneeConfiguration (key, data) VALUES (?, ?)`,
        [CONFIG_KEY, CONFIG_DATA],
        function (err) {
          if (err) {
            if (err.code === "SQLITE_CONSTRAINT") {
              resolve(false);
            } else {
              reject(err);
            }
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  async DeleteConfig(CONFIG_KEY) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM PuffaneeConfiguration WHERE key = ?`,
        [CONFIG_KEY],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async UpdateConfig(CONFIG_KEY, NEW_DATA) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE PuffaneeConfiguration SET data = ? WHERE key = ?`,
        [NEW_DATA, CONFIG_KEY],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async GetConfig(CONFIG_KEY) {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT data FROM PuffaneeConfiguration WHERE key = ?`,
        [CONFIG_KEY],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row ? row.data : "DataNotFoundInDb");
          }
        }
      );
    });
  }

  StringToType(type, value) {
    switch (type) {
      case "object":
        try {
          return JSON.parse(value);
        } catch (error) {
          return "invalid_json_format";
        }
      case "boolean":
      case "bool":
        return value === "true";
      case "number":
        const num = Number(value);
        if (isNaN(num)) return "invalid_number_format";
        return num;
      case "string":
        return value.toString();
      case "date":
      case "datetime":
        const date = new Date(value);
        if (isNaN(date.getTime())) "invalid_date_format";
        return date;
      case "null":
        return null;
      case "undefined":
        return undefined;
      default:
        return "invalid_type";
    }
  }

  ToString(value) {
    if (value === null) {
      return "null";
    } else if (value === undefined) {
      return "undefined";
    } else if (typeof value === "object") {
      try {
        return JSON.stringify(value);
      } catch (error) {
        return "object_to_string_failed";
      }
    } else if (value instanceof Date) {
      return value.toISOString();
    } else {
      return value.toString();
    }
  }
}
