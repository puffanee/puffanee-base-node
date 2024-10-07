export class PuffaneeSupportJS {
  /**
   * Get random in array
   *
   * @param {Array} array
   * @returns
   */
  random(array) {
    const randomI = Math.floor(Math.random() * array.length);
    return array[randomI];
  }

  /**
   * Get a random number between minimum and maximum
   *
   * @param {number} min Minimum mumber (default is 1)
   * @param {number} max Maximum number (default is 999)
   * @returns {number} Number
   */
  randomNumber(min = 1, max = 999) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Get a random letter in alphabet
   *
   * @param {string} alphabet Default is "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
   * @returns {string} Letter
   */
  randomLetter(
    alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  ) {
    return alphabet[Math.floor(Math.random() * alphabet.length)];
  }
}
