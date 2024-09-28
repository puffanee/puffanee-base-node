import express from "express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import {
  PuffaneeAPI,
  PuffaneeMediaStorage,
  PuffaneeMediaCheck,
  PuffaneeTime,
  PuffaneeLogs,
  PuffaneeFilter,
  PuffaneeCustomDiscord,
  PuffaneeSupportJS,
  PuffaneeClient,
} from "../../index.js";

import { t } from "tasai";
import crypto from "crypto";
import os from "os";
import net from "net";

const DEFAULT_CONFIG = {
  portrange_mi: 25650,
  portrange_mx: 25660,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const pfportrange = (port) => {
  return (
    port >= DEFAULT_CONFIG.portrange_mi && port <= DEFAULT_CONFIG.portrange_mx
  );
};
const portuse = (port) => {
  return new Promise((resolve, reject) => {
    const tester = net.createConnection({ port }, () => {
      tester.end();
      resolve(true);
    });

    tester.on("error", (err) => {
      if (err.code === "ECONNREFUSED") {
        resolve(false);
      } else {
        reject(err);
      }
    });
  });
};

/**
 *  extends ({
  PuffaneeAPI,
  PuffaneeMediaStorage,
  PuffaneeMediaCheck,
  PuffaneeTime,
  PuffaneeLogs,
  PuffaneeFilter,
  PuffaneeCustomDiscord,
  PuffaneeSupportJS,
  PuffaneeClient,
})
 */

/**
 * Puffanee Web Panel Class
 */
export class PuffaneeWebPanel {
  /**
   *
   * @param {*} Client Bot Discord Client
   * @param {number} Port Web panel Port
   * @param {string} ViewsPath Express views path (index.ejs, home.ejs etc. pages)
   * @param {string} StaticPath Express statics path (*.css, *.js etc.)
   * @param {object} Passwords Security passwords ( This Object data must contain 'Master' and 'Operation' password hash in same name values. Hash methods are in documents)
   * @param {Date} AppStartTime App start Date Time ( Defaukt is: Date() )
   */
  constructor(
    Client,
    Port,
    ViewsPath,
    StaticPath,
    Passwords,
    AppStartTime = Date()
  ) {
    if (Client !== null) {
      this.client = Client;
    } else {
      new Error("[Puffanee] Web Class Construct Error: 'Client' invalid");
    }
    if (web_port !== null && typeof web_port === "number") {
      if (pfportrange(Port)) {
        if (!portuse(Port)) {
          this.web_port = Port;
        } else {
          new Error(
            "[Puffanee] Web Class Construct Error: Port (" + Port + ") is busy!"
          );
        }
      } else {
        new Error(
          "[Puffanee] Web Class Construct Error: Port (" +
            Port +
            ") is invalid. (Puffanee Web Panel port range is " +
            DEFAULT_CONFIG.portrange_mi +
            " to " +
            DEFAULT_CONFIG.portrange_mx +
            ")"
        );
      }
    } else {
      new Error("[Puffanee] Web Class Construct Error: 'Port' invalid");
    }
    if (
      ViewsPath !== null &&
      typeof ViewsPath === "string" &&
      StaticPath !== null &&
      typeof StaticPath === "string"
    ) {
      this.Path_Views = ViewsPath;
      this.Path_Static = StaticPath;
    } else {
      new Error(
        "[Puffanee] Web Class Construct Error: 'Views Path' or/and 'Static Path' invalid"
      );
    }
    if (Passwords !== null && typeof Passwords === "object") {
      this.HashOfMasterPassword = Passwords.Master;
      this.HashOfOperationPassword = Passwords.Operation;
    } else {
      new Error("[Puffanee] Web Class Construct Error: 'Passwords' invalid");
    }
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
   * @param {object} Security Security configuration object data
   * @param {string} PuffaneeMTNCDG_Path Puffanee Maintenance Debug Database Configuration class path string
   */
  async Open(Security, PuffaneeMTNCDG_Path) {
    const {
      getDebugState,
      setDebugState,
      getMaintenanceState,
      setMaintenanceState,
      OppositeDebugState,
      OppositeMaintenanceState,
    } = await import(PuffaneeMTNCDG_Path);
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(join(__dirname, this.Path_Static)));
    app.set("view engine", "ejs");
    app.set("views", join(__dirname, this.Path_Views));

    app.listen(this.web_port, () => {
      console.log(
        t.bold.blue.toFunction()("[Puffanee] ") +
          t.bold.yellow.toFunction()("Web ") +
          t.green.toFunction()(`Running on http://localhost:${this.web_port}`)
      );
    });

    app.get("/", (req, res) => {
      res.render("index", {
        bot: this.client,
      });
    });

    app.get("/uptime", (req, res) => {
      const uptimeString = CalculateUptime();
      res.json({ uptime: uptimeString });
    });

    app.get("/ping", (req, res) => {
      const pingString = this.client.ws.ping;
      res.json({ ping: pingString });
    });

    app.post("/operation", async (req, res) => {
      const { password, type, newData } = req.body;

      if (this.CheckOperationPassword(password)) {
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
          const oppositedDebug = await OppositeDebugState();
          const updatedDebug = await setDebugState(oppositedDebug);

          if (updatedDebug) {
            res.json({
              validation: true,
              success: true,
              newStatus: oppositedDebug,
            });
          } else {
            res.json({
              validation: true,
              success: false,
              newStatus: null,
            });
          }
        } else if (type === "maintenancestate") {
          const oppositedMtnc = await OppositeMaintenanceState();
          const updatedMtnc = await setMaintenanceState(oppositedMtnc);

          if (updatedMtnc) {
            res.json({
              validation: true,
              success: true,
              newStatus: oppositedMtnc,
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

      if (this.CheckMasterPassword(pwd)) {
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

      if (this.CheckOperationPassword(pwd)) {
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

      if (await CheckMasterPassword(pwd)) {
        let clienData = {};

        const activity = this.client.user?.presence.activities[0];
        const status = this.client.user?.presence.status;

        let AuthorizedServersData = [];
        let NotAuthorizedServersData = [];

        if (Security.AuthorizedServers !== null) {
          this.client.guilds.cache.forEach(async (guild) => {
            if (!Security.AuthorizedServers.includes(guild.id)) {
              NotAuthorizedServersData.push(`${guild.id}`);
            } else {
              AuthorizedServersData.push(`${guild.id}`);
            }
          });
        }

        const MachineIpAdresses = MachineIpAdressesList();

        clienData = {
          Presence: { ActivityData: activity, Status: status },
          MaintenanceState: await getMaintenanceState(),
          DebugState: await getDebugState(),
          ServerAuthorize: {
            ValidServers: Security.AuthorizedServers,
            AuthorizedServers: AuthorizedServersData,
            NotAuthorizedServers: NotAuthorizedServersData,
          },
          Developers: Security.Developers,
          AuthorizedIpAdresses: Security.AuthorizedIpAdresses,
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
