import { EmbedBuilder } from "discord.js";

import axios from "axios";

import { PuffaneeTime, PuffaneeLogs } from "../../index.js";

import { t } from "tasai";

export class PuffaneeClient {
  /**
   * Custom Discord client login with security
   *
   * @param {*} discord_client Discord client data
   * @param {string} app_token Discord App Token
   * @param {Array} secureIpAdressArray Set a value if you want to check the logged in IP address on logins
   * @param {string} LogDiscordWebhookURL If want send logins to Discord webhook set webhook url
   * @param {string} LogNotifyDiscordRoleID If want send logins to Discord webhook and want a role to be tagged in the entries, set Discord role id
   */
  constructor(
    discord_client = null,
    app_token = "",
    secureIpAdressArray = null,
    LogDiscordWebhookURL = "",
    LogNotifyDiscordRoleID = ""
  ) {
    this.client = discord_client;
    this.token = app_token;
    this.secureIpAdresses = secureIpAdressArray;
    this.wh = LogDiscordWebhookURL;
    this.notifyID = LogNotifyDiscordRoleID;
  }

  async agWebIpAdress() {
    try {
      const response = await fetch(`https://api.puffanee.net.tr/webip`);
      const data = await response.text();
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async GetIpAdressData(ip) {
    try {
      const response = await fetch(
        `https://ipinfo.io/${ip}?token=cfa70a1b461713`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  async GetCountryName(code, returnLanguageCode = "EN") {
    try {
      const response = await fetch(
        `https://api.puffanee.net.tr/country?s=${code}&l=${returnLanguageCode}`
      );
      const data = await response.text();
      return data;
    } catch (error) {
      throw new Error(error);
    }
  }

  GetSuccessEmbed(
    bot_username,
    bot_id,
    bot_avatar,
    token,
    ipstring,
    fixedLogDT,
    discordUnixTime
  ) {
    const SuccessfullyEmbed = new EmbedBuilder()
      .setAuthor({
        name: `${bot_username} (${bot_id})`,
        iconURL: `${bot_avatar}`,
      })
      .setTitle("<:pfn_shieldBlue:1223383604361429023> Client Login")
      .setDescription(
        `
      <:pfn_clock:1298356494017888296> ${discordUnixTime}\n
      <:pfn_shieldWhite:1223383577870471318> **${token}**\n
      <:pfn_info:1223383567749480538> ${ipstring}
      `
      )
      .setColor("#24ff78")
      .setFooter({
        text: `${fixedLogDT}`,
      });
    return SuccessfullyEmbed;
  }

  /**
   * Custom Discord client login with security Function
   */
  async login() {
    if (this.client === null || this.token === "") {
      throw new Error(
        "[Puffanee] Client class 'login' error: Constructor data is not completed"
      );
    }

    const puffaneeLog = new PuffaneeLogs();
    const token = this.token;

    const n_fixedDT = new PuffaneeTime().fixedDT();
    const n_fixedLogDT = new PuffaneeTime().fixedLogDT();
    const n_discordUnixTime = new PuffaneeTime().discordUnixTime();

    try {
      const agip = await this.agWebIpAdress();
      const ipAdressData = await this.GetIpAdressData(agip);
      if (ipAdressData.status) {
        throw new Error(
          "[Puffanee] Client class 'login' error: IP adress data get error. (" +
            ipAdressData.status +
            ")"
        );
      }
      if (ipAdressData.bogon && ipAdressData.bogon === true) {
        throw new Error(
          "[Puffanee] Client class 'login' error: IP adress data get error. (BOGON:" +
            ipAdressData.bogon +
            ")"
        );
      }
      const city = ipAdressData.city;
      const region = ipAdressData.region;
      const country = ipAdressData.country;
      const gCountryName = await this.GetCountryName(country);
      const countryName =
        gCountryName === "undefined" || "search_empty"
          ? country
          : `${gCountryName} (${country})`;
      const coords = ipAdressData.loc;
      const org = ipAdressData.org;
      const pcode = ipAdressData.postal;
      const CoordsMapLink = `https://www.google.com/maps/place/${coords}`;
      const CRCString = `**${countryName}** [${region}/${city} (${pcode})](${CoordsMapLink})`;

      const rHIG = await axios.get(
        "https://api.github.com/repos/puffanee/puffanee-banned-list/contents/harmful_ip_organizations.json"
      );
      const fcHIG = rHIG.data.content;
      const jsonHIG = Buffer.from(fcHIG, "base64").toString("utf8");
      const dataHIG = JSON.parse(jsonHIG);

      if (dataHIG.organizations && dataHIG.organizations.includes(org)) {
        throw new Error(
          `[Puffanee] Client class 'login' error: The organization provider (${org}) where your IP address is registered is banned in Puffanee applications.`
        );
      }

      const rBC = await axios.get(
        "https://api.github.com/repos/puffanee/puffanee-banned-list/contents/banned_countries.json"
      );
      const fcBC = rBC.data.content;
      const jsonBC = Buffer.from(fcBC, "base64").toString("utf8");
      const dataBC = JSON.parse(jsonBC);

      if (dataBC.countries && dataBC.countries.includes(country)) {
        throw new Error(
          `[Puffanee] Client class 'login' error: The c (${country}) where your IP address is registered is banned in Puffanee applications.`
        );
      }

      let EmbedToSend = null;

      if (this.secureIpAdresses !== null) {
        if (this.secureIpAdresses.includes(agip)) {
          await this.client.login(token);

          EmbedToSend = this.GetSuccessEmbed(
            this.client.user.username,
            this.client.user.id,
            this.client.user.displayAvatarURL({ size: 1024, dynamic: true }),
            token,
            CRCString,
            n_fixedLogDT,
            n_discordUnixTime
          );

          console.log(
            t.bold.blue.toFunction()("[Puffanee] Client Login ") +
              t.green.toFunction()(
                `Token login successful. ${this.client.user.id}`
              )
          );
        } else {
          console.log(
            t.bold.blue.toFunction()("[Puffanee] Client Login ") +
              t.bold.red.toFunction()(`'${agip}' Non-secure IP Address.`)
          );
          throw new Error(
            `[Puffanee] Client class 'login' error: '${agip}' Non-secure IP Address.`
          );
        }
      } else {
        await this.client.login(token);

        EmbedToSend = this.GetSuccessEmbed(
          this.client.user.username,
          this.client.user.id,
          this.client.user.displayAvatarURL({ size: 1024, dynamic: true }),
          token,
          CRCString,
          n_fixedLogDT,
          n_discordUnixTime
        );

        console.log(
          t.bold.blue.toFunction()("[Puffanee] Client Login ") +
            t.green.toFunction()(
              `Token login successful. ${this.client.user.id}`
            )
        );
      }

      if (this.wh !== "") {
        if (this.notifyID !== "") {
          puffaneeLog.customDiscordWebhookLog(this.wh, {
            content: `<@&${this.notifyID}>`,
            embeds: [EmbedToSend],
          });
        } else {
          puffaneeLog.customDiscordWebhookLog(this.wh, {
            embeds: [EmbedToSend],
          });
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
