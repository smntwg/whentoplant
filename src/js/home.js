(function () {
  var dataEl = document.getElementById("month-data");
  var panel = document.getElementById("this-month-panel");
  if (!dataEl || !panel) return;

  var months;
  try {
    months = JSON.parse(dataEl.textContent);
  } catch (error) {
    return;
  }

  var month = months[new Date().getMonth()];
  if (!month) return;

  panel.replaceChildren();

  var eyebrow = document.createElement("p");
  eyebrow.className = "eyebrow";
  eyebrow.textContent = month.name;

  var heading = document.createElement("h2");
  heading.id = "this-month-heading";
  heading.textContent = "What to plant in " + month.name;

  var summary = document.createElement("p");
  summary.textContent = month.summary;

  var list = document.createElement("ul");
  list.className = "highlights";
  month.highlights.forEach(function (item) {
    var li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });

  var link = document.createElement("a");
  link.className = "text-link";
  link.href = month.path;
  link.textContent = month.name + " planting calendar";

  panel.append(eyebrow, heading, summary, list, link);
  panel.dataset.ready = "true";
})();
