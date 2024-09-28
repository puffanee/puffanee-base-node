import { EmbedBuilder, WebhookClient } from "discord.js";
import axios from "axios";
import { sleep, PuffaneeTime } from "../../index.js";

export class PuffaneeLogs {
  /**
   * Discord Webhook LOG
   *
   * @param {string} webhook Log webhook url
   * @param {boolean} isValidLogger If user logger name, set true
   * @param {JSON} logData Webhook log data (contain required: title, description, colorname, logger)
   */
  discordWebhookLog(webhook, isValidLogger = false, logData) {
    const embed = new EmbedBuilder()
      .setTitle(logData.title)
      .setDescription(logData.description)
      .setTimestamp()
      .setColor(`${logData.colorname}`)
      .setFooter({
        text: "Powered by Puffanee",
        iconURL:
          "https://cdn.discordapp.com/attachments/1232790590811275306/1242172365169885307/PuffaneePIconLogo200x200.png?ex=6663f0ea&is=66629f6a&hm=6390d5ba9e8c6d5d565d5a566004d30960597b5a08669340dc32b047420ca7a5&",
      });

    const message = {
      content: `[📃] ${logData.logger} | ${new PuffaneeTime().fixedDT()}`,
      embeds: [embed],
    };

    if (isValidLogger) {
      embed.setAuthor({
        name: `${logData.logger} tarafından gönderildi`,
      });
    }

    const webhookClient = new WebhookClient({ url: webhook });
    webhookClient.send(message);
  }

  /**
   * Custom Discord Webhook LOG
   *
   * @param {string} webhook Log webhook url
   * @param {*} message Webhook data
   */
  customDiscordWebhookLog(webhook, message) {
    const webhookClient = new WebhookClient({ url: webhook });
    webhookClient.send(message);
  }

  /**
   * Get Log File - Puffanee File Logging
   *
   * @param {string} loggingDir Logging dir
   * @param {string} type Log type (ex: info, warns etc.)
   */
  async getLogFile(loggingDir, type) {
    const logDir = loggingDir;
    const logFileName = new PuffaneeTime().fixedDate() + ".log";
    const logFile = path.join(logDir, logFileName);

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    if (!fs.existsSync(logFile)) {
      fs.writeFileSync(logFile, "", "utf-8");
    }

    return logFile;
  }

  /**
   * Clear Log Files - Puffanee File Logging
   *
   * @param {string} dir Clear dirF
   */
  clearLogFiles(dir) {
    fs.readdir(dir, (err, files) => {
      if (err) {
        console.error("clearLogFiles, Unable to list files, Error:", err);
        return;
      }

      files.forEach((file) => {
        if (path.extname(file) === ".log") {
          const filePath = path.join(dir, file);
          fs.writeFileSync(filePath, "", "utf8");
        }
      });
    });
  }

  /**
   * Write Log File - Puffanee File Logging
   *
   * @param {string} logFilePath Log file path
   * @param {*} data Log to file data
   */
  writeToLogFile(logFilePath, data) {
    try {
      fs.appendFileSync(logFilePath, `${data}\n`, "utf8");
    } catch (e) {
      console.log(
        `writeToLogFile, Data not write to file ${logFilePath}, Error: ${e}`
      );
    }
  }

  /**
   * Out Logging (File Logging) Run Function - Puffanee File Logging
   *
   * @param {string} type Log type (ex: info, warns etc.)
   * @param {string} from Logged from
   * @param {string} message Log message
   * @param {boolean} discordLog If want send message to Discord webhook
   * @param {string} discordWebhookUrl Discord webhook url
   */
  async outLogging(
    type,
    from,
    message,
    discordLog = false,
    discordWebhookUrl = ""
  ) {
    const logFile = await this.getLogFile(type);
    const logLine = `[${new PuffaneeTime().fixedLogDT()} ${from}] ${type}: ${message}`;
    this.writeToLogFile(logFile, logLine);

    if (discordLog && discordWebhookUrl != "") {
      try {
        await sleep(1000);
        const response = this.customDiscordWebhookLog(discordWebhookUrl, {
          content: logLine,
        });

        //console.log('outLogging, Logged, Response:', response);
      } catch (error) {
        console.error(
          `outLogging DC: ${discordLog}, WH: ${discordWebhookUrl} Mesaj gönderme hatası: ${error.message}`
        );
      }
    }
  }
}
