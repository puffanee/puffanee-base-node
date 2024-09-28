export class PuffaneeTime {
  /**
   * With time (Return example: 1970/12/31 59:59:59)
   *
   * @returns
   */
  fixedDT() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    var h = String(now.getHours()).padStart(2, "0");
    var mi = String(now.getMinutes()).padStart(2, "0");
    var s = String(now.getSeconds()).padStart(2, "0");
    return `${y}/${m}/${d} ${h}:${mi}:${s}`;
  }

  /**
   * No time (Return example: 1970/12/31)
   *
   * @returns
   */
  fixedDate() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  /**
   * Time and Unix (Return example: 1111111111 1970/12/31 59:59:59)
   *
   * @returns
   */
  fixedLogDT() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    var h = String(now.getHours()).padStart(2, "0");
    var mi = String(now.getMinutes()).padStart(2, "0");
    var s = String(now.getSeconds()).padStart(2, "0");
    return `${this.unixTime()} ${y}/${m}/${d} ${h}:${mi}:${s}`;
  }

  /**
   * Only Unix (Return example: 1111111111)
   *
   * @returns
   */
  unixTime() {
    var now = new Date();
    const TinS = Math.floor(now.getTime() / 1000);
    return TinS;
  }

  /**
   * Add hours and get remaining unix (Return example: 1111111111)
   *
   * @returns
   */
  remainingUnixTime(addHours) {
    var now = new Date();
    now.setHours(now.getHours() + addHours);
    const TinS = Math.floor(now.getTime() / 1000);
    return TinS;
  }

  /**
   * Add hours and get remaining Discord message unix (Return example: <t:1111111111:R>)
   *
   * @returns
   */
  discordRemainingUnixTime(addHours) {
    return `<t:${this.remainingUnixTime(addHours)}:R>`;
  }

  /**
   * Unix with Discord message (Return example: <t:1111111111:R>)
   *
   * @returns
   */
  discordUnixTime() {
    var now = new Date();
    const TinS = Math.floor(now.getTime() / 1000);
    return `<t:${TinS}:R>`;
  }

  /**
   * Calculate prime time
   *
   * @returns
   */
  calcPrimeTime(startHour, endHour, currentHour, configPrimeManuel) {
    if (configPrimeManuel) {
      return true;
    }

    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    } else {
      return currentHour >= startHour && currentHour < endHour;
    }
  }

  /**
   * Prime time is valid
   *
   * @returns
   */
  checkPrimeTime(startHour, endHour, configPrimeManuel) {
    const currentHour = new Date().getHours();
    let isPrime = this.calcPrimeTime(startHour, endHour, currentHour);

    if (configPrimeManuel) {
      isPrime = true;
    }

    const primeTimeMessage = isPrime
      ? "Prime Time Etkin!"
      : "Prime Time Etkin Değil!";

    return { primeTime: isPrime, primeTimeMessage: primeTimeMessage };
  }
}
