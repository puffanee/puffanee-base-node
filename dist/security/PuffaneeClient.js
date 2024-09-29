import { EmbedBuilder } from "discord.js";

import {
  PuffaneeTime,
  PuffaneeLogs,
  PuffaneeCustomDiscord,
} from "../../index.js";

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

  /**
   * Custom Discord client login with security Function
   */
  async login() {
    if (this.client === null || this.token === "") {
      throw new TypeError("Constructor data is not complete");
    }

    const pfDiscord = new PuffaneeCustomDiscord(this.client);
    const puffaneeLog = new PuffaneeLogs();
    const token = this.token;

    try {
      const agip = await this.agWebIpAdress();

      if (this.secureIpAdresses !== null) {
        if (this.secureIpAdresses.includes(agip)) {
          await this.client.login(token);

          const successEmbed = new EmbedBuilder()
            .setTitle(
              `[${new PuffaneeTime().fixedDT()}] ${
                this.client.user.username
              } Client Girişi Yapıldı`
            )
            .setDescription(
              `Token **${token}** ile **${agip}** IP adresinden giriş yapıldı`
            )
            .setColor("Green")
            .setFooter({
              text: "Powered by Puffanee",
              iconURL:
                "https://cdn.discordapp.com/attachments/1232790590811275306/1242172365169885307/PuffaneePIconLogo200x200.png?ex=6663f0ea&is=66629f6a&hm=6390d5ba9e8c6d5d565d5a566004d30960597b5a08669340dc32b047420ca7a5&",
            })
            .setTimestamp();

          console.log(
            t.bold.blue.toFunction()("[Puffanee] Client Login ") +
              t.green.toFunction()(
                `Token login successful. ${this.client.user.id}`
              )
          );

          if (this.wh !== "") {
            puffaneeLog.customDiscordWebhookLog(this.wh, {
              content: `<@&${this.notifyID}>`,
              embeds: [successEmbed],
            });
          }
        } else {
          console.log(
            t.bold.blue.toFunction()("[Puffanee] Client Login ") +
              t.bold.red.toFunction()(`'${agip}' Non-secure IP Address.`)
          );
        }
      } else {
        await this.client.login(token);

        const successEmbed = new EmbedBuilder()
          .setTitle(
            `[${new PuffaneeTime().fixedDT()}] ${
              this.client.user.username
            } Client Girişi Yapıldı`
          )
          .setDescription(
            `Token **${token}** ile **${agip}** IP adresinden giriş yapıldı`
          )
          .setColor("Green")
          .setFooter({
            text: "Powered by Puffanee",
            iconURL:
              "https://cdn.discordapp.com/attachments/1232790590811275306/1242172365169885307/PuffaneePIconLogo200x200.png?ex=6663f0ea&is=66629f6a&hm=6390d5ba9e8c6d5d565d5a566004d30960597b5a08669340dc32b047420ca7a5&",
          })
          .setTimestamp();

        console.log(
          t.bold.blue.toFunction()("[Puffanee] Client Login ") +
            t.green.toFunction()(
              `Token login successful. ${this.client.user.id}`
            )
        );

        if (this.wh !== "") {
          puffaneeLog.customDiscordWebhookLog(this.wh, {
            content: `<@&${this.notifyID}>`,
            embeds: [successEmbed],
          });
        }
      }
    } catch (error) {
      throw new Error(error);
    }
  }
}
