import { ImageAnnotatorClient } from "@google-cloud/vision";
import { PuffaneeTime } from "../../index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_OPTIONS = {
  DEFAULT_SAFE_SCORES: {
    adultScore: 4, // control w/ <=
    spoofScore: 3, // control w/  <
    medicalScore: 3, // control w/ <=
    violenceScore: 3, // control w/ <=
    racyScore: 4, // control w/ <=
  },
  library_data_path: path.join(__dirname, "..", "..", "..", "_data"),
};

export class PuffaneeMediaCheck {
  /**
   * Puffanee Media Check construct
   *
   * @param {string} googlekey_file_name Your Google Key Json file name (default is 'google_key.json')
   */
  constructor(googlekey_file_name = "google_key.json") {
    if (
      googlekey_file_name === null ||
      googlekey_file_name === undefined ||
      googlekey_file_name === " " ||
      googlekey_file_name === "" ||
      typeof googlekey_file_name !== "string"
    ) {
      throw new Error(
        "[Puffanee] Media Check Class Construct Error: 'Google Key File Name' is invalid"
      );
    }

    if (!fs.existsSync(DEFAULT_OPTIONS.library_data_path)) {
      throw new Error(
        `[Puffanee] Media Check Class Construct Error: Library '_data' directory not found`
      );
    }

    const KeyFile = path.join(
      DEFAULT_OPTIONS.library_data_path,
      googlekey_file_name
    );

    if (!fs.existsSync(KeyFile)) {
      throw new Error(
        `[Puffanee] Media Check Class Construct Error: Your Google key file (${KeyFile}) was not found in the '_data' directory of the library`
      );
    }

    this.ggVisionClient = new ImageAnnotatorClient({
      keyFilename: KeyFile,
    });
  }

  /**
   * Check url image safety
   * 
   * @param {string} imageUrl Control Image Url
   * @param {*} scoreSettings Score control settings default is {
    adultScore: 3, // control w/ <=
    spoofScore: 3, // control w/  <
    medicalScore: 2, // control w/ <=
    violenceScore: 3, // control w/ <=
    racyScore: 4, // control w/ <=
  }
   * @returns 
   */
  async imageSafetyControl(imageUrl, scoreSettings = null) {
    try {
      const [result] = await this.ggVisionClient.safeSearchDetection(imageUrl);
      const detections = result.safeSearchAnnotation;
      //console.log("result :>> ", result);

      if (scoreSettings == null) {
        scoreSettings = DEFAULT_OPTIONS.DEFAULT_SAFE_SCORES;
      } else {
        if (
          !scoreSettings["adultScore"] ||
          !scoreSettings["spoofScore"] ||
          !scoreSettings["medicalScore"] ||
          !scoreSettings["violenceScore"] ||
          !scoreSettings["racyScore"]
        ) {
          console.error(
            `[Puffanee] Media Check Class 'imageSafetyControl' Error: 'Score settings' is not fully`
          );
          return false;
        }
      }

      if (result.error?.code) {
        console.error(
          `[Puffanee] Media Check Class 'imageSafetyControl' Error: ${result.error?.message?.toString()} (${
            result.error?.code
          })`
        );
        return false;
      }

      const adultLikelihood = detections.adult;
      const spoofLikelihood = detections.spoof;
      const medicalLikelihood = detections.medical;
      const violenceLikelihood = detections.violence;
      const racyLikelihood = detections.racy;

      const likelihoodScore = {
        VERY_UNLIKELY: 0,
        UNLIKELY: 1,
        POSSIBLE: 2,
        LIKELY: 3,
        VERY_LIKELY: 4,
      };

      const adultScore = likelihoodScore[adultLikelihood];
      const spoofScore = likelihoodScore[spoofLikelihood];
      const medicalScore = likelihoodScore[medicalLikelihood];
      const violenceScore = likelihoodScore[violenceLikelihood];
      const racyScore = likelihoodScore[racyLikelihood];

      if (
        adultScore <= scoreSettings["adultScore"] &&
        spoofScore < scoreSettings["spoofScore"] &&
        medicalScore <= scoreSettings["medicalScore"] &&
        violenceScore <= scoreSettings["violenceScore"] &&
        racyScore <= scoreSettings["racyScore"]
      ) {
        return {
          valid: true,
          scores: {
            adult: adultScore,
            spoof: spoofScore,
            medical: medicalScore,
            violence: violenceScore,
            racy: racyScore,
          },
        };
      } else {
        return {
          valid: false,
          scores: {
            adult: adultScore,
            spoof: spoofScore,
            medical: medicalScore,
            violence: violenceScore,
            racy: racyScore,
          },
        };
      }
    } catch (error) {
      console.error(
        `[Puffanee] Media Check Class 'imageSafetyControl' Error analyzing image:`,
        error
      );
      return false;
    }
  }

  /**
   * Image safety control set message
   *
   * @param {Object} scores Scores
   * @param {string} language Messages langugage
   * @param {*} scoreSettings Score control settings default is default construct score settings
   * @param {number} returnSetting '0' or '1'
   */
  evaluateScores(scores, language, scoreSettings = null, returnSetting = 0) {
    if (scoreSettings == null) {
      scoreSettings = DEFAULT_OPTIONS.DEFAULT_SAFE_SCORES;
    } else {
      if (
        !scoreSettings["adultScore"] ||
        !scoreSettings["spoofScore"] ||
        !scoreSettings["medicalScore"] ||
        !scoreSettings["violenceScore"] ||
        !scoreSettings["racyScore"]
      ) {
        return "UNDEFINED";
      }
    }

    const adultScore = scoreSettings["adultScore"];
    const spoofScore = scoreSettings["spoofScore"];
    const medicalScore = scoreSettings["medicalScore"];
    const violenceScore = scoreSettings["violenceScore"];
    const racyScore = scoreSettings["racyScore"];

    let result = [];

    if (scores.adult >= adultScore) {
      result.push(
        language === "tr"
          ? "● Yetişkin içeriği (naked fotoğraflar, aşırı naked çizimler, ekstra fazla kan veya cinsel organ)"
          : "● Adult content (nude photos, excessive nude drawings, extra blood or genitalia)"
      );
    }
    if (scores.spoof >= spoofScore) {
      result.push(
        language === "tr"
          ? "● Sahte / parodi içerik (internetten alıntı, uygulama ekranından alınmış veya fazla referans içerme)"
          : "● Fake / parody content (quoted from the internet, taken from the application screen or contain too many references)"
      );
    }
    if (scores.medical >= medicalScore) {
      result.push(
        language === "tr"
          ? "● Medikal içerik (fazla kan, ameliyat gibi medikal şeyler ve eşyalar)"
          : "● Medical content (medical supplies and items such as excess blood, surgery)"
      );
    }
    if (scores.violence >= violenceScore) {
      result.push(
        language === "tr"
          ? "● Şiddet içeriği (fazla kavga-dövüş, yumruk, silah vb.)"
          : "● Violent content (too much fight, punch, gun, etc.)"
      );
    }
    if (scores.racy >= racyScore) {
      result.push(
        language === "tr"
          ? "● Aşırı müstehcenlik (aşırı meme içeriği veya görünür ucu, aşırı görünür kalça)"
          : "● Excess Racy content (excess breast content or visible tip, excess visible buttocks)"
      );
    }

    if (result.length > 0) {
      if (returnSetting === 0) {
        return result.join(", ");
      } else if (returnSetting === 1) {
        return result.join("\n");
      }
    } else {
      return language === "tr" ? "● Hiç bir sorun yok" : "● No problems found";
    }
  }
}
