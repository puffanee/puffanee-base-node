import { dirname } from "node:path";
import fetch from "node-fetch";

export class PuffaneeFilter {
  constructor() {
    const __filename = new URL(import.meta.url).pathname;
    this.__dirname = dirname(__filename);

    this.initPromise = this.init();
  }

  async init() {
    try {
      this.bw_blacklist = await this.fetchJSON(
        "https://raw.githubusercontent.com/puffanee/filter/refs/heads/main/bw_blacklist.json"
      );
      this.bw_whitelist = await this.fetchJSON(
        "https://raw.githubusercontent.com/puffanee/filter/refs/heads/main/bw_whitelist.json"
      );
      this.lf_whitelist = await this.fetchJSON(
        "https://raw.githubusercontent.com/puffanee/filter/refs/heads/main/lf_whitelist.json"
      );
    } catch (error) {
      console.error("Error loading JSON files:", error);
      throw error;
    }
  }

  async fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  /**
   * Check if the string contains bad words
   *
   * @param {string} inputString Check string
   * @returns
   */
  async checkBadWord(inputString) {
    await this.initPromise;
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
  async checkLink(string) {
    await this.initPromise;
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