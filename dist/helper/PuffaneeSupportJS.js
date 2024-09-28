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
}
