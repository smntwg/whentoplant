(function () {
  var form = document.getElementById("frost-form");
  var select = document.getElementById("region");
  var result = document.getElementById("frost-result");
  if (!form || !select || !result) return;

  function show(id, scroll) {
    var cards = document.querySelectorAll("[data-region]");
    var match = null;
    cards.forEach(function (card) {
      var on = card.getAttribute("data-region") === id;
      card.classList.toggle("is-selected", on);
      if (on) match = card;
    });
    if (!match) {
      result.hidden = true;
      return;
    }
    result.hidden = false;
    result.replaceChildren();
    var title = document.createElement("h2");
    title.textContent = match.getAttribute("data-name");
    var clone = match.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.remove("is-selected");
    var cloneHeading = clone.querySelector("h2");
    if (cloneHeading) cloneHeading.remove();
    result.append(title, clone);
    if (scroll) {
      result.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!select.value) return;
    history.replaceState(null, "", "#" + select.value);
    show(select.value, true);
  });

  function fromHash() {
    var id = location.hash.replace("#", "");
    if (!id) return;
    var option = select.querySelector('option[value="' + id + '"]');
    if (!option) return;
    select.value = id;
    show(id, false);
  }

  fromHash();
  window.addEventListener("hashchange", fromHash);
})();
