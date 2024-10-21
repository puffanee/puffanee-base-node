function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
  var expires = "expires=" + d.toGMTString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  var name = cname + "=";
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(";");
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

$(document).ready(function () {
  $(document).on("mouseenter", '[data-copy="true"]', function () {
    $(this).css("cursor", "pointer");
  });

  $(document).on("click", '[data-copy="true"]', function () {
    var copyText = $(this).attr("data-copytext");

    var tempInput = $("<textarea>");
    $("body").append(tempInput);
    tempInput.val(copyText).select();
    document.execCommand("copy");
    tempInput.remove();

    stateShow(
      true,
      '<i class="fa-solid fa-check" style="font-size: 50px; color: var(--softgreen-color);"></i>'
    );
    showAlert(`Copied: '${copyText}'`, "bg__softgreen", "bg__softgreen__dark");
  });
});

$("#SecurityLogin").on("click", async function () {
  const mpws = prompt("Please enter Master Password");
  if (mpws !== null) {
    s2Spinner(true);
    const l = await MasterLogin(mpws);
    if (l === true) {
      s2Spinner(false);
      stateShow(
        true,
        '<i class="fa-solid fa-check" style="font-size: 50px; color: var(--softgreen-color);"></i>'
      );
      showAlert(
        `Welcome! (Your session is valid for 1 day)`,
        "bg__softgreen",
        "bg__softgreen__dark"
      );
      setTimeout(() => {
        document.location.reload();
      }, 2000);
    } else {
      s2Spinner(false);
      stateShow(
        true,
        '<i class="fa-solid fa-xmark" style="font-size: 50px; color: var(--softred-color);"></i>'
      );
      showAlert(`Invalid login.`, "bg__softred", "bg__softred__dark");
    }
  }
});

$("#SecurityLogin2").on("click", async function () {
  const mpws = prompt("Please enter Master Password");
  if (mpws !== null) {
    s2Spinner(true);
    const l = await MasterLogin(mpws);
    if (l === true) {
      s2Spinner(false);
      stateShow(
        true,
        '<i class="fa-solid fa-check" style="font-size: 50px; color: var(--softgreen-color);"></i>'
      );
      showAlert(
        `Welcome! (Your session is valid for 1 day)`,
        "bg__softgreen",
        "bg__softgreen__dark"
      );
      setTimeout(() => {
        document.location.reload();
      }, 2000);
    } else {
      s2Spinner(false);
      stateShow(
        true,
        '<i class="fa-solid fa-xmark" style="font-size: 50px; color: var(--softred-color);"></i>'
      );
      showAlert(`Invalid login.`, "bg__softred", "bg__softred__dark");
    }
  }
});

async function MasterPasswordCheck(pwd) {
  return new Promise((resolve, reject) => {
    $.get(`/masterpassword/${pwd}`, function (data) {
      resolve(data.validation);
    }).fail(function (err) {
      reject(err);
    });
  });
}

async function OpPasswordLogin(pwd) {
  if (pwd === null || pwd === undefined || pwd === "" || pwd === " ") {
    return "Please enter an password.";
  }
  const cookie = getCookie("__mst");
  const cookiePwd = getCookie("__mstpw");

  if (cookie !== "" && cookiePwd !== "") {
    try {
      const data = await $.get(`/oppassword/${pwd}`);
      return data.validation;
    } catch (err) {
      console.error("Error during password validation:", err);
      return "Error during password validation.";
    }
  } else {
    return "You are not logged in.";
  }
}

function POST(url, data) {
  return $.ajax({
    url: url,
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify(data),
  });
}

async function OperationSend(pwd, op, newdata) {
  const cookie = getCookie("__mst");
  const cookiePwd = getCookie("__mstpw");

  if (cookie !== "" && cookiePwd !== "") {
    try {
      const response = await POST("/operation", {
        password: pwd,
        type: op,
        newData: newdata,
      });
      return response;
    } catch (err) {
      console.error("Error during operation:", err);
      return "Error during operation.";
    }
  } else {
    return "You are not logged in.";
  }
}

async function MasterLogin(pwd) {
  if (pwd === null || pwd === undefined || pwd === "" || pwd === " ") {
    return "Please enter an password.";
  }

  const cookie = getCookie("__mst");
  const cookiePwd = getCookie("__mstpw");
  if (cookie === "" && cookiePwd === "") {
    try {
      const pwdcheck = await MasterPasswordCheck(pwd);
      if (pwdcheck) {
        setCookie("__mst", "true", 1);
        setCookie("__mstpw", pwd, 1);
        return true;
      } else {
        return "Unauthorized password.";
      }
    } catch (err) {
      console.error("Error during password check:", err);
      return "Error during password validation.";
    }
  } else {
    return "You are already logged in.";
  }
}

async function GetUserDiscordProfile(DiscordId) {
  return new Promise((resolve, reject) => {
    $.get(
      `https://gate.puffanee.net.tr/public/GetDiscordUser?discord_id=${DiscordId}`,
      function (data) {
        resolve(data);
      }
    ).fail(function (err) {
      reject(err);
    });
  });
}

async function GetServerInfo(ServerID) {
  return new Promise((resolve, reject) => {
    $.get(`/guild/${ServerID}`, function (data) {
      resolve(data);
    }).fail(function (err) {
      reject(err);
    });
  });
}

(function () {
  const stylePfn =
    "font-size: 50px; font-weight: bold; color: white; background-color: dodgerblue; text-shadow: 2px 2px black; padding: 20px; border: 5px solid white; border-radius: 10px;";
  const styleMsg =
    "font-size: 50px; font-weight: bold; color: white; background-color: darkred; text-shadow: 2px 2px black; padding: 20px; border: 5px solid red; border-radius: 10px;";
  console.log("%cPUFFANEE", stylePfn);
  console.log(
    "%cDİKKAT: Bu konsol üzerinden size herhangi bir kod çalıştırmanız veya bir elemanın içeriğini isteyenlerin dediklerini yapmayınız. Bunları yapmak çok ciddi güvenlik sorunlarına neden olabilir.\nCAUTION: Do not use this console to run any code or request the contents of an element. Doing so can cause very serious security problems.",
    styleMsg
  );
  setInterval(() => {
    console.log(
      "%cDİKKAT: Bu konsol üzerinden size herhangi bir kod çalıştırmanız veya bir elemanın içeriğini isteyenlerin dediklerini yapmayınız. Bunları yapmak çok ciddi güvenlik sorunlarına neden olabilir.\nCAUTION: Do not use this console to run any code or request the contents of an element. Doing so can cause very serious security problems.",
      styleMsg
    );
  }, 2000);
})();
