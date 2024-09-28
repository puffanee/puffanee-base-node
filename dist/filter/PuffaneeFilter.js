import fs from "fs";

export class PuffaneeFilter {
  constructor() {
    const badWordJSONFile =
      "src/puffaneeBase/dist/filter/badWord_filter/bw_blacklist.json";
    const badWordJSONData = fs.readFileSync(badWordJSONFile);
    const badWordWHLJSONFile =
      "src/puffaneeBase/dist/filter/badWord_filter/bw_whitelist.json";
    const badWordWHLJSONData = fs.readFileSync(badWordWHLJSONFile);
    const linkFilterWHLJSONFile =
      "src/puffaneeBase/dist/filter/link_filter/lf_whitelist.json";
    const linkFilterWHLJSONData = fs.readFileSync(linkFilterWHLJSONFile);

    this.bw_blacklist = JSON.parse(badWordJSONData);
    this.bw_whitelist = JSON.parse(badWordWHLJSONData);
    this.lf_whitelist = JSON.parse(linkFilterWHLJSONData);
  }

  /**
   * Check if the string contains bad words
   *
   * @param {string} inputString Check string
   * @returns
   */
  checkBadWord(inputString) {
    const words = inputString.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (
        this.bw_blacklist.includes(word) &&
        !this.bw_whitelist.includes(word)
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if the string contains a link and check if the link(s) in the string are whitelisted
   *
   * @param {string} string Check string
   * @returns
   */
  checkLink(string) {
    const links = string.match(/https?:\/\/[^\s]+/g);
    if (!links) {
      return false;
    }
    for (const link of links) {
      if (!this.lf_whitelist.includes(link)) {
        return true;
      }
    }
    return false;
  }
}
