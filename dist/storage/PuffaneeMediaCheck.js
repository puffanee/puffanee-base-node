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
  googlekey_jsonfile: path.resolve(__dirname, "../../google_key.json"),
};

export class PuffaneeMediaCheck {
  constructor() {
    this.ggVisionClient = new ImageAnnotatorClient({
      keyFilename: DEFAULT_OPTIONS.googlekey_jsonfile,
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
          console.log("scoreSettings is not fully");
          return false;
        }
      }

      if (result.error?.code) {
        console.log(
          result.error?.message?.toString() + " (" + result.error?.code + ")"
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
      console.error("Error analyzing image:", error);
      return false;
    }
  }
}
