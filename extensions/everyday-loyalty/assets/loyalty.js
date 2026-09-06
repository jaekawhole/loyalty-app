(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var root = document.getElementById("everyday-loyalty-root");
    if (!root) return;

    if (root.getAttribute("data-logged-in") !== "true") {
      root.remove();
      return;
    }

    var accent = root.getAttribute("data-accent") || "#1a1a1a";
    root.style.setProperty("--jl-accent", accent);

    var proxyBase = root.getAttribute("data-proxy") || "/apps/loyalty";
    var label = root.getAttribute("data-label") || "Fid�lit�";

    function proxyUrl() {
      return proxyBase;
    }

    fetch(proxyUrl(), { credentials: "same-origin" })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.visible) {
          root.remove();
          return;
        }
        mountWidget(data);
      })
      .catch(function () {
        root.remove();
      });

    function mountWidget(initialData) {
      root.hidden = false;
      var t = initialData.i18n || {};

      var launcher = document.createElement("button");
      launcher.className = "jl-launcher";
      launcher.type = "button";
      launcher.setAttribute("aria-label", label);
      launcher.innerHTML =
        '<span aria-hidden="true">?</span><span>' + label + "</span>";

      var panel = document.createElement("div");
      panel.className = "jl-panel";
      panel.innerHTML =
        '<div class="jl-panel-wrap">' +
        '<button type="button" class="jl-close" aria-label="' +
        (t.close || "Fermer") +
        '">�</button>' +
        '<div class="jl-header">' +
        "<h2></h2>" +
        '<p class="jl-sub"></p>' +
        '<div class="jl-balance">' +
        '<div class="label">' +
        (t.balanceLabel || "Votre solde") +
        "</div>" +
        '<div class="value">0</div>' +
        "</div>" +
        "</div>" +
        '<div class="jl-body"></div>' +
        "</div>";

      root.appendChild(panel);
      root.appendChild(launcher);

      var open = false;
      function setOpen(next) {
        open = next;
        panel.classList.toggle("is-open", open);
      }

      launcher.addEventListener("click", function () {
        setOpen(!open);
        if (open) renderPanel(initialData);
      });
      panel.querySelector(".jl-close").addEventListener("click", function () {
        setOpen(false);
      });

      function renderPanel(data) {
        t = data.i18n || t;
        var sub = panel.querySelector(".jl-sub");
        var balanceBox = panel.querySelector(".jl-balance");
        var body = panel.querySelector(".jl-body");
        var pointsName = data.pointsCurrencyName || "points";

        panel.querySelector("h2").textContent = data.programName || "Fid�lit�";
        balanceBox.querySelector(".label").textContent =
          t.balanceLabel || "Votre solde";
        sub.textContent = data.programActive
          ? t.subtitle || ""
          : t.paused || "Programme temporairement suspendu";

        balanceBox.querySelector(".value").textContent =
          (data.balance || 0) + " " + pointsName;

        var canRedeem =
          data.programActive && (data.balance || 0) >= (data.redeemCost || 0);

        body.innerHTML =
          '<div class="jl-section-title">' +
          (t.earnTitle || "") +
          "</div>" +
          '<div class="jl-card"><h3>' +
          (t.placeOrder || "") +
          "</h3><p>" +
          (t.earnDesc || "") +
          "</p></div>" +
          '<div class="jl-section-title">' +
          (t.redeemTitle || "") +
          "</div>" +
          '<div class="jl-card"><h3>' +
          (t.offLabel || "") +
          "</h3><p>" +
          data.redeemCost +
          " " +
          pointsName +
          '</p><button type="button" class="jl-btn jl-redeem" ' +
          (canRedeem ? "" : "disabled") +
          ">" +
          (t.redeemBtn || "") +
          "</button>" +
          '<div class="jl-msg" hidden></div></div>';

        var redeemBtn = body.querySelector(".jl-redeem");
        var msg = body.querySelector(".jl-msg");
        if (!redeemBtn) return;

        redeemBtn.addEventListener("click", function () {
          redeemBtn.disabled = true;
          redeemBtn.textContent = t.creating || "�";
          fetch(proxyUrl(), {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent: "redeem",
              amount: data.defaultRedeemAmount,
            }),
          })
            .then(function (r) {
              return r.json().then(function (j) {
                return { ok: r.ok, j: j };
              });
            })
            .then(function (res) {
              msg.hidden = false;
              if (!res.ok) {
                msg.className = "jl-msg error";
                msg.textContent = res.j.error || t.redeemFailed;
                redeemBtn.disabled = false;
                redeemBtn.textContent = t.redeemBtn;
                return;
              }
              msg.className = "jl-msg";
              msg.innerHTML =
                t.yourCode +
                " <strong>" +
                res.j.code +
                "</strong><br/>" +
                t.applyCheckout +
                " " +
                res.j.balance;
              redeemBtn.textContent = t.redeemed;
              balanceBox.querySelector(".value").textContent =
                res.j.balance + " " + pointsName;
              initialData.balance = res.j.balance;
            })
            .catch(function () {
              msg.hidden = false;
              msg.className = "jl-msg error";
              msg.textContent = t.networkError;
              redeemBtn.disabled = false;
              redeemBtn.textContent = t.redeemBtn;
            });
        });
      }
    }
  });
})();
