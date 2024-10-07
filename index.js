import axios from "axios";
import { t } from "tasai";

/* !!!!!! DO NOT CHANGE !!!!!! */
export const version = "3.3.0";
/* !!!!!! DO NOT CHANGE !!!!!! */

export { PuffaneeAPI } from "./dist/api/PuffaneeAPI.js";
export {
  PuffaneeMediaStorage,
  PuffaneeMediaCheck,
} from "./dist/storage/index.js";
export {
  PuffaneeTime,
  PuffaneeCustomDiscord,
  PuffaneeSupportJS,
  PuffaneeConfig,
} from "./dist/helper/index.js";
export { PuffaneeLogs } from "./dist/log/PuffaneeLogs.js";
export { PuffaneeFilter } from "./dist/filter/PuffaneeFilter.js";
export { PuffaneeClient } from "./dist/security/PuffaneeClient.js";
export { PuffaneeWebPanel } from "./dist/panel/PuffaneeWebPanel.js";
export function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const gtRe = await axios.get(
  "https://api.github.com/repos/puffanee/puffanee-base-node/contents/index.js",
  {
    headers: {
      Authorization: `Bearer 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`,
    },
  }
);
const c = Buffer.from(gtRe.data.content, "base64").toString("utf8");
const vM = c.match(/export const version = "(.+)";/);
const gV = vM ? vM[1] : null;
const lV = version;

if (lV !== gV) {
  console.log(
    `${t.bold.blue.toFunction()("[Puffanee Base]")} ${t.bold.white.toFunction()(
      `v${lV}`
    )} | ${t.bold.red.toFunction()(
      `A new version is available. (v${gV}) Please run command: node . update in PuffaneeBase directory`
    )}`
  );
}
