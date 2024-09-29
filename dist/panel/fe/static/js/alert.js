function showAlert(message, bgColor, progressBgColor) {
  var alert = $("<div>")
    .addClass("alert")
    .addClass("show")
    .addClass(`${bgColor}`);
  var alertTextIcon = $("<div>").addClass("alert-text-icon").appendTo(alert);
  var alertMessage = $("<div>")
    .addClass("alert-message")
    .text(message)
    .appendTo(alertTextIcon)
    .on("click", function () {
      hideAlert(alert);
    });
  var alertProgress = $("<div>")
    .addClass("alert-progress")
    .appendTo(alert)
    .addClass(`${progressBgColor}`);
  var alertBar = $("<div>").addClass("alert-bar").appendTo(alertProgress);

  var alerts = $(".alert");

  var marginTop =
    $(window).width() < 768 ? alerts.length * 80 : alerts.length * 60;
  if (alerts.length > 0) {
    alert.css("margin-top", marginTop + "px");
  }

  alert.appendTo("#alerts");

  move(alert);
  setTimeout(function () {
    hideAlert(alert);
  }, 4000);
}

function hideAlert(alert) {
  alert.removeClass("show").remove();
}

function move(alert) {
  var elem = alert.find(".alert-progress .alert-bar");
  var width = 1;
  var interval = setInterval(frame, 50);

  function frame() {
    if (width >= 100) {
      clearInterval(interval);
    } else {
      width++;
      elem.css("width", width + "%");
    }
  }
}

function s2Spinner(state) {
  if (state) {
    $(".operation-spinner-wrapper").css("display", "flex").hide().fadeIn(200);

    setTimeout(function () {
      if ($(".operation-spinner-wrapper").is(":visible")) {
        showAlert(
          `İşlem beklenenden uzun sürüyor, sayfayı yenileyerek tekrar deneyebilirsin.`,
          "bg__softred",
          "bg__softred__dark"
        );
      }
    }, 9000);
  } else {
    $(".operation-spinner-wrapper").fadeOut(200, function () {
      $(this).css("display", "none");
    });
  }
}

function stateShow(state, icon) {
  if (state) {
    $(".stateshow-wrapper")
      .css("display", "flex")
      .hide()
      .fadeIn(200, function () {
        $(".stateshow-icon").html(icon).hide().fadeIn(200);
      });

    setTimeout(function () {
      $(".stateshow-icon").fadeOut(200, function () {
        $(this).html("");
        $(".stateshow-wrapper").fadeOut(200, function () {
          $(this).css("display", "none");
        });
      });
    }, 2000);
  } else {
    $(".stateshow-icon").fadeOut(200, function () {
      $(this).html("");
      $(".stateshow-wrapper").fadeOut(200, function () {
        $(this).css("display", "none");
      });
    });
  }
}
