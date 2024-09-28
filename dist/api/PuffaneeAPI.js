const DEFAULT_SETTINGS = {
  pf_apibase: "https://api.puffanee.net.tr",
};

export class PuffaneeAPI {
  constructor(pf_accesskey) {
    this.pf_access = pf_accesskey;
  }

  /**
   * Parse Puffanee users identify string
   *
   * @param {string} identifyString
   * @returns
   */
  parseUserIdentify(identifyString) {
    const ps = identifyString.split(":", 2);
    if (ps.length === 2) {
      return { identify_type: ps[0], identify_card: ps[1] };
    } else {
      return { identify_type: "undefined", identify_card: "undefined" };
    }
  }

  /**
   * Send GET to API
   *
   * @param {string} endpoint
   * @param {*} sendData
   * @returns
   */
  async sGET(endpoint, sendData) {
    try {
      const response = await fetch(
        `${DEFAULT_SETTINGS.pf_apibase}/${endpoint}/${this.pf_access}/${sendData}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Send DELETE to API
   *
   * @param {string} endpoint
   * @param {*} sendData
   * @returns
   */
  async sDELETE(endpoint, sendData) {
    try {
      const responseDelete = await fetch(
        `${DEFAULT_SETTINGS.pf_apibase}/${endpoint}/${this.pf_access}/${sendData}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const deleteData = await responseDelete.json();
      return deleteData;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Send POST to API
   *
   * @param {string} endpoint
   * @param {*} sendData
   * @returns
   */
  async sPOST(endpoint, sendData) {
    try {
      sendData.append("pf_access", this.pf_access);
      const responsePost = await fetch(
        `${DEFAULT_SETTINGS.pf_apibase}/${endpoint}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: sendData,
        }
      );
      const postData = await responsePost.json();
      return postData;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Send PUT to API
   *
   * @param {string} endpoint
   * @param {*} sendData
   * @returns
   */
  async sPUT(endpoint, sendData) {
    try {
      sendData.pf_access = this.pf_access;
      const responsePut = await fetch(
        `${DEFAULT_SETTINGS.pf_apibase}/${endpoint}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sendData),
        }
      );
      const putData = await responsePut.json();
      return putData;
    } catch (error) {
      throw new Error(error);
    }
  }
}
