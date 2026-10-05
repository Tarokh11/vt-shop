"use strict";

document.querySelectorAll("[data-add-form]").forEach((button) => {
  button.addEventListener("click", () => {
    const prefix = button.dataset.addForm;
    const total = document.getElementById(`id_${prefix}-TOTAL_FORMS`);
    const maximum = document.getElementById(`id_${prefix}-MAX_NUM_FORMS`);
    const container = document.querySelector(`[data-formset="${prefix}"]`);
    const template = document.getElementById(`${prefix}-template`);
    const index = Number(total.value);
    if (index >= Number(maximum.value)) {
      button.disabled = true;
      return;
    }
    const fragment = template.content.cloneNode(true);
    fragment.querySelectorAll("*").forEach((element) => {
      for (const attribute of ["id", "name", "for"]) {
        if (element.hasAttribute(attribute)) {
          element.setAttribute(attribute, element.getAttribute(attribute).replaceAll("__prefix__", index));
        }
      }
    });
    container.appendChild(fragment);
    total.value = index + 1;
    container.lastElementChild.querySelector("input:not([type=hidden])")?.focus();
  });
});

// Delegation also covers newly added variant rows.
document.querySelector(".editor-form")?.addEventListener("change", (event) => {
  if (event.target.matches('input[name$="-is_default"]') && event.target.checked) {
    document.querySelectorAll('input[name$="-is_default"]').forEach((other) => {
      if (other !== event.target) other.checked = false;
    });
  }
});
