import express from "express";
import path, { dirname, join } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import https from "https"; // HTTPS modülünü dahil ediyoruz

import crypto from "crypto";
import os from "os";
import { t } from "tasai";

import { PuffaneeConfig } from "../helper/PuffaneeConfig.js";

import { ActivityType } from "discord.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DEFAULT_CONFIG = {
  portrange_mi: 25650,
  portrange_mx: 25660,
  library_data_path: path.join(__dirname, "..", "..", "..", "_data"),
};

const pfportrange = (port) => {
  return (
    port >= DEFAULT_CONFIG.portrange_mi && port <= DEFAULT_CONFIG.portrange_mx
  );
};

/**
 * Puffanee Web Panel Class
 */
export class PuffaneeWebPanel extends PuffaneeConfig {
  /**
   *
   * @param {*} Client Bot Discord Client
   * @param {number} WebPort Run port
   * @param {object} Passwords Security passwords ( This Object data must contain 'Master' and 'Operation' password hash in same name values. Hash methods are in documents)
   * @param {Date} AppStartTime App start Date Time ( Default is: Date() )
   */
  constructor(Client, WebPort, Passwords, AppStartTime = new Date()) {
    super();

    if (!Client) {
      throw new Error(
        "[Puffanee] Web Class Construct Error: 'Client' is invalid"
      );
    }
    this.client = Client;

    if (!WebPort || typeof WebPort !== "number") {
      throw new Error(
        "[Puffanee] Web Class Construct Error: 'WebPort' is invalid"
      );
    }
    if (!pfportrange(WebPort)) {
      throw new Error(
        "[Puffanee] Web Class Construct Error: 'WebPort' is not in Puffanee Ports Range"
      );
    }
    this.Port = WebPort;

    this.Path_Views = "./fe/views/";
    this.Path_Static = "./fe/static/";

    if (!fs.existsSync(join(__dirname, this.Path_Views))) {
      throw new Error(
        "[Puffanee] Web Class Construct Error: 'Views Path' not found. Please reinstall Puffanee Base"
      );
    }

    if (!fs.existsSync(join(__dirname, this.Path_Static))) {
      throw new Error(
        "[Puffanee] Web Class Construct Error: 'Views Path' not found. Please reinstall Puffanee Base"
      );
    }

    if (!fs.existsSync(DEFAULT_OPTIONS.library_data_path)) {
      throw new Error(
        `[Puffanee] Web Class Construct Error: Library '_data' directory not found`
      );
    }

    const SSL_keyPath = path.join(
      DEFAULT_OPTIONS.library_data_path,
      "server.key"
    );
    const SSL_certPath = path.join(
      DEFAULT_OPTIONS.library_data_path,
      "server.cert"
    );

    this.SSLPath_Key = SSL_keyPath;
    this.SSLPath_Cert = SSL_certPath;

    if (
      !Passwords ||
      typeof Passwords !== "object" ||
      !Passwords.Master ||
      !Passwords.Operation
    ) {
      throw new Error(
        "[Puffanee] Web Class Construct Error: 'Passwords' are invalid"
      );
    }
    this.HashOfMasterPassword = Passwords.Master;
    this.HashOfOperationPassword = Passwords.Operation;

    this.AppStartDT = AppStartTime;
  }

  /**
   * This machine IPv4 adresses list
   * @returns {Object} IPv4 list
   */
  MachineIpAdressesList() {
    const networkInterfaces = os.networkInterfaces();
    const ipAddresses = [];

    for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];

      for (const iface of interfaces) {
        if (iface.family === "IPv4" && !iface.internal) {
          ipAddresses.push(iface.address);
        }
      }
    }

    return ipAddresses;
  }

  /**
   * Calculate app uptime time with construct data
   * @returns {string} Uptime time string
   */
  CalculateUptime() {
    const currentTime = new Date();
    const timeDiff = currentTime - this.AppStartDT;

    const seconds = Math.floor((timeDiff / 1000) % 60);
    const minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
    const hours = Math.floor((timeDiff / (1000 * 60 * 60)) % 24);
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    let uptimeString = "";

    if (days > 0) {
      uptimeString += `${days} days `;
    }
    if (hours > 0) {
      uptimeString += `${hours} hours `;
    }
    if (minutes > 0) {
      uptimeString += `${minutes} minutes `;
    }
    if (seconds > 0) {
      uptimeString += `${seconds} seconds `;
    }

    return uptimeString.trim();
  }

  /**
   * Validate master password
   * @param {string} pwd Not hashed password string
   * @returns {boolean}
   */
  async CheckMasterPassword(pwd) {
    const pwdHash = crypto.createHash("md5").update(pwd).digest("hex");

    if (pwdHash === this.HashOfMasterPassword) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Validate operation password
   * @param {string} pwd Not hashed password string
   * @returns {boolean}
   */
  async CheckOperationPassword(pwd) {
    const pwdHash = crypto.createHash("sha1").update(pwd).digest("hex");

    if (pwdHash === this.HashOfOperationPassword) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * Change active Discord Bot Client status
   * @param {string} newStatus "online", "dnd", "idle" or "invisibile"
   * @returns {boolean || string} If new status not same previous status return true else return "same"
   */
  ChangeBotStatus(newStatus) {
    const activity = this.client.user?.presence.activities[0];
    const activityName = activity?.name;
    const activityType = activity?.type;
    const status = this.client.user?.presence.status;

    if (newStatus !== status) {
      this.client.user?.setPresence({
        activities: [
          {
            name: activityName,
            type: activityType,
          },
        ],
        status: newStatus,
      });
      return true;
    } else {
      return "same";
    }
  }

  /**
   * Open new express server with construct data
   */
  async Open() {
    if (!this.Path_Views || !this.Path_Static) {
      throw new Error("[Puffanee] Web Class Open Error: 'Paths' are not set");
    }

    const pfconfig = new PuffaneeConfig();

    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(join(__dirname, this.Path_Static)));
    app.set("views", join(__dirname, this.Path_Views));
    app.set("view engine", "ejs");

    if (!fs.existsSync(this.SSLPath_Key)) {
      throw new Error("[Puffanee] Open panel error: no SSL server.key found");
    } else {
      console.log(
        t.bold.blue.toFunction()("[Puffanee] ") +
          t.bold.yellow.toFunction()("Web Certificate ") +
          t.green.toFunction()(`server.key founded.`)
      );
    }

    if (!fs.existsSync(this.SSLPath_Cert)) {
      throw new Error("[Puffanee] Open panel error: no SSL server.cert found");
    } else {
      console.log(
        t.bold.blue.toFunction()("[Puffanee] ") +
          t.bold.yellow.toFunction()("Web Certificate ") +
          t.green.toFunction()(`server.cert founded.`)
      );
    }

    let sslOptions = {};

    try {
      sslOptions = {
        key: fs.readFileSync(this.SSLPath_Key),
        cert: fs.readFileSync(this.SSLPath_Cert),
        // ca: fs.readFileSync(join(certPath, "ca.pem")), 'ca' not using. //
      };
    } catch (error) {
      console.error(
        "[Puffanee] Open panel error: SSL Cerificate files view error:",
        error
      );
    }

    https.createServer(sslOptions, app).listen(this.Port, () => {
      console.log(
        t.bold.blue.toFunction()("[Puffanee] ") +
          t.bold.yellow.toFunction()("Web ") +
          t.green.toFunction()(`Running on https://localhost:${this.Port}`)
      );
    });

    app.get("/", (req, res) => {
      res.render("index", {
        bot: this.client,
      });
    });

    app.get("/uptime", (req, res) => {
      const uptimeString = this.CalculateUptime();
      res.json({ uptime: uptimeString });
    });

    app.get("/ping", (req, res) => {
      const pingString = this.client.ws.ping;
      res.json({ ping: pingString });
    });

    app.post("/operation", async (req, res) => {
      const { password, type, newData } = req.body;

      if (await this.CheckOperationPassword(password)) {
        if (type === "ChangeStatus") {
          const updatedStatus = this.ChangeBotStatus(newData);
          if (updatedStatus) {
            res.json({
              validation: true,
              success: true,
              newStatus: updatedStatus,
            });
          } else {
            res.json({
              validation: true,
              success: false,
              newStatus: updatedStatus,
            });
          }
        } else if (type === "debugstate") {
          const GetDebugState = await pfconfig.GetConfig("AppDebugState");
          let Opposite;
          if (GetDebugState === "1") {
            Opposite = false;
          } else if (GetDebugState === "0") {
            Opposite = true;
          }
          const updatedDebug = await pfconfig.UpdateConfig(
            "AppDebugState",
            Opposite
          );

          if (Opposite) {
            console.log(
              t.bold.blue.toFunction()("[Puffanee] ") +
                t.bold.white.toFunction()("Configuration ") +
                t.green.toFunction()(
                  `The 'Debug' configuration was activated by the panel.`
                )
            );
          } else {
            console.log(
              t.bold.blue.toFunction()("[Puffanee] ") +
                t.bold.white.toFunction()("Configuration ") +
                t.red.toFunction()(
                  `The 'Debug' configuration has been disabled by the panel.`
                )
            );
          }

          if (updatedDebug) {
            res.json({
              validation: true,
              success: true,
              newStatus: Opposite,
            });
          } else {
            res.json({
              validation: true,
              success: false,
              newStatus: null,
            });
          }
        } else if (type === "maintenancestate") {
          const GetMtncState = await pfconfig.GetConfig("AppMaintenanceState");
          let Opposite;
          if (GetMtncState === "1") {
            Opposite = false;
          } else if (GetMtncState === "0") {
            Opposite = true;
          }
          const updatedMtnc = await pfconfig.UpdateConfig(
            "AppMaintenanceState",
            Opposite
          );

          const activity = this.client.user?.presence.activities[0];
          const activityName = activity?.name;
          const activityType = activity?.type;
          const activityStatus = this.client.user?.presence.status;

          function saveActivityToFile(activity) {
            fs.writeFileSync(
              join(
                DEFAULT_CONFIG.library_data_path,
                "webpanel_lastrpcact.json"
              ),
              JSON.stringify(activity)
            );
          }
          function loadActivityFromFile() {
            if (
              fs.existsSync(
                join(
                  DEFAULT_CONFIG.library_data_path,
                  "webpanel_lastrpcact.json"
                )
              )
            ) {
              const data = fs.readFileSync(
                join(
                  DEFAULT_CONFIG.library_data_path,
                  "webpanel_lastrpcact.json"
                )
              );
              return JSON.parse(data);
            }
            return null;
          }

          let lastActivity = {
            name: null,
            type: null,
            status: null,
          };

          if (Opposite) {
            lastActivity.name = activityName;
            lastActivity.type = activityType;
            lastActivity.status = activityStatus;
            saveActivityToFile(lastActivity);

            this.client.user?.setPresence({
              activities: [
                {
                  name: `🔧 Bakım / Maintenance Active`,
                  type: ActivityType.Listening,
                },
              ],
              status: "dnd",
            });

            console.log(
              t.bold.blue.toFunction()("[Puffanee] ") +
                t.bold.white.toFunction()("Configuration ") +
                t.green.toFunction()(
                  `The 'Maintenance' configuration was activated by the panel.`
                )
            );
          } else {
            const savedActivity = loadActivityFromFile();
            if (savedActivity) {
              lastActivity = savedActivity;
            }

            if (lastActivity.name && lastActivity.type && lastActivity.status) {
              this.client.user?.setPresence({
                activities: [
                  { name: lastActivity.name, type: lastActivity.type },
                ],
                status: lastActivity.status,
              });
            }

            console.log(
              t.bold.blue.toFunction()("[Puffanee] ") +
                t.bold.white.toFunction()("Configuration ") +
                t.red.toFunction()(
                  `The 'Maintenance' configuration has been disabled by the panel.`
                )
            );
          }

          if (updatedMtnc) {
            res.json({
              validation: true,
              success: true,
              newStatus: Opposite,
            });
          } else {
            res.json({
              validation: true,
              success: false,
              newStatus: null,
            });
          }
        } else {
          res.json({
            validation: true,
            success: false,
            message: "Invalid operation type.",
          });
        }
      } else {
        res.json({
          validation: false,
          success: false,
          message: "Incorrect password.",
        });
      }
    });

    app.get("/masterpassword/:pwd", async (req, res) => {
      const pwd = req.params.pwd;

      if (await this.CheckMasterPassword(pwd)) {
        res.send({
          validation: true,
        });
      } else {
        res.send({
          validation: false,
        });
      }
    });

    app.get("/oppassword/:pwd", async (req, res) => {
      const pwd = req.params.pwd;

      if (await this.CheckOperationPassword(pwd)) {
        res.send({
          validation: true,
        });
      } else {
        res.send({
          validation: false,
        });
      }
    });

    app.get("/guild/:gid", async (req, res) => {
      const guildid = req.params.gid;

      try {
        const guild = await this.client.guilds.fetch(guildid);
        res.send({
          success: true,
          id: guild.id,
          name: guild.name,
          icon: guild.iconURL(),
          memberCount: guild.memberCount,
          ownerId: guild.ownerId,
        });
      } catch (error) {
        res.send({
          success: false,
        });
      }
    });

    app.get("/clientdata/:pwd", async (req, res) => {
      const pwd = req.params.pwd;

      if (await this.CheckMasterPassword(pwd)) {
        let clienData = {};

        const activity = this.client.user?.presence.activities[0];
        const status = this.client.user?.presence.status;

        let C_AuthorizedServers = await pfconfig.GetConfig(
          "Security_AuthorizedServers"
        );
        let C_MaintenanceState = await pfconfig.GetConfig(
          "AppMaintenanceState"
        );
        let C_DebugState = await pfconfig.GetConfig("AppDebugState");
        let C_Developers = await pfconfig.GetConfig("Developers");
        let C_AuthorizedIpAdresses = await pfconfig.GetConfig(
          "Security_AuthorizedIpAdresses"
        );

        if (C_MaintenanceState === "DataNotFoundInDb")
          C_MaintenanceState = false;
        if (C_DebugState === "DataNotFoundInDb") C_DebugState = false;

        let AuthorizedServersData = [];
        let NotAuthorizedServersData = [];

        if (C_AuthorizedServers !== "DataNotFoundInDb") {
          C_AuthorizedServers = JSON.parse(C_AuthorizedServers);
          this.client.guilds.cache.forEach(async (guild) => {
            if (!C_AuthorizedServers.includes(guild.id)) {
              NotAuthorizedServersData.push(`${guild.id}`);
            } else {
              AuthorizedServersData.push(`${guild.id}`);
            }
          });
        }

        if (C_Developers !== "DataNotFoundInDb") {
          C_Developers = JSON.parse(C_Developers);
        } else {
          C_Developers = [];
        }

        if (C_AuthorizedIpAdresses !== "DataNotFoundInDb") {
          C_AuthorizedIpAdresses = JSON.parse(C_AuthorizedIpAdresses);
        } else {
          C_AuthorizedIpAdresses = [];
        }

        const MachineIpAdresses = this.MachineIpAdressesList();

        clienData = {
          Presence: { ActivityData: activity, Status: status },
          MaintenanceState: C_MaintenanceState,
          DebugState: C_DebugState,
          ServerAuthorize: {
            AuthorizedServers: AuthorizedServersData,
            NotAuthorizedServers: NotAuthorizedServersData,
          },
          Developers: C_Developers,
          AuthorizedIpAdresses: C_AuthorizedIpAdresses,
          MachineIpAdresses: MachineIpAdresses,
        };

        res.send({
          validation: true,
          clientData: clienData,
        });
      } else {
        res.send({
          validation: false,
          clientData: null,
        });
      }
    });
  }
}
