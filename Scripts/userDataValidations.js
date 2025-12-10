function validateEmployeeForm() {
  clearErrors();

  let isValid = true;
  let firstErrorField = null;

  const name = document.getElementById("name");
  const dateIn = document.getElementById("dateIn");
  const rfc = document.getElementById("rfc");
  const salary = document.getElementById("salary");
  const dept = document.getElementById("dept");
  const curp = document.getElementById("curp");
  const days = document.getElementById("days");
  const role = document.getElementById("role");
  const nss = document.getElementById("nss");
  const period = document.getElementById("period");

  if (!validateRequired(name, "El nombre es obligatorio.")) {
    isValid = false;
    if (!firstErrorField) firstErrorField = name;
  }
  if (!validateRequired(dept, "El departamento es obligatorio.")) {
    isValid = false;
    if (!firstErrorField) firstErrorField = dept;
  }
  if (!validateRequired(role, "El puesto es obligatorio.")) {
    isValid = false;
    if (!firstErrorField) firstErrorField = role;
  }

  if (!validateDate(dateIn)) {
    isValid = false;
    if (!firstErrorField) firstErrorField = dateIn;
  }

  if (!validateRFC(rfc)) {
    isValid = false;
    if (!firstErrorField) firstErrorField = rfc;
  }

  if (!validateNumber(salary, 0.01)) {
    isValid = false;
    if (!firstErrorField) firstErrorField = salary;
  }

  if (!validateCURP(curp)) {
    isValid = false;
    if (!firstErrorField) firstErrorField = curp;
  }

  if (!validateNSS(nss)) {
    isValid = false;
    if (!firstErrorField) firstErrorField = nss;
  }

  if (!validateNumber(days, 0)) {
    isValid = false;
    if (!firstErrorField) firstErrorField = days;
  } else {
    if (!validateDaysByPeriod(days, period)) {
      isValid = false;
      if (!firstErrorField) firstErrorField = days;
    }
  }

  if (period.value === "") {
    showError(period, "Debes seleccionar una periodicidad.");
    isValid = false;
    if (!firstErrorField) firstErrorField = period;
  }

  if (!isValid) {
    Swal.fire({
      icon: "error",
      title: "Formulario Incompleto",
      text: "Por favor, corrige los campos marcados en rojo antes de continuar.",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#ef4444",
      background: "#f8fafc",
      customClass: {
        popup: "rounded-xl shadow-xl",
      },
    }).then(() => {
      if (firstErrorField) firstErrorField.focus();
    });
  }

  return isValid;
}

// --- FUNCIONES AUXILIARES Y REGEX ---
function validateRequired(input, msg) {
  if (input.value.trim() === "") {
    showError(input, msg);
    return false;
  }
  return true;
}

function validateDate(input) {
  if (input.value === "") {
    showError(input, "La fecha de ingreso es obligatoria.");
    return false;
  }

  const inputDate = new Date(input.value + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (inputDate > today) {
    showError(input, "La fecha de ingreso no puede ser futura.");
    return false;
  }
  if (inputDate.getFullYear() < 1950) {
    showError(input, "La fecha de ingreso no parece válida (muy antigua).");
    return false;
  }
  return true;
}

function validateRFC(input) {
  const value = input.value.trim().toUpperCase();
  const regexRFC = /^([A-ZÑ&]{4})\d{6}([A-Z0-9]{3})$/;

  if (!regexRFC.test(value)) {
    showError(
      input,
      "El RFC debe tener 4 letras, 6 números (fecha) y 3 de homoclave."
    );
    return false;
  }
  return true;
}

function validateCURP(input) {
  const value = input.value.trim().toUpperCase();
  const regexCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;

  if (!regexCURP.test(value)) {
    showError(
      input,
      "Formato inválido. Verifica los 18 caracteres de la CURP."
    );
    return false;
  }
  return true;
}

function validateNSS(input) {
  const value = input.value.trim();
  const regexNSS = /^\d{11}$/;

  if (!regexNSS.test(value)) {
    showError(input, "El NSS debe contener exactamente 11 números.");
    return false;
  }
  return true;
}

function validateNumber(input, minVal) {
  const value = parseFloat(input.value);
  if (isNaN(value) || value < minVal) {
    showError(input, `El valor debe ser numérico y mayor a ${minVal}.`);
    return false;
  }
  return true;
}

function validateDaysByPeriod(daysInput, periodInput) {
  const daysVal = parseInt(daysInput.value);
  const periodVal = periodInput.value;

  if (periodVal === "") return true;

  let maxDays = 30;
  let msg = "";

  if (periodVal === "Semanal") {
    maxDays = 7;
    msg = "En pago Semanal no puede trabajar más de 7 días.";
  } else if (periodVal === "Quincenal") {
    maxDays = 15;
    msg = "En pago Quincenal no puede trabajar más de 15 días.";
  } else if (periodVal === "Mensual") {
    maxDays = 30;
    msg = "En pago Mensual no puede trabajar más de 30 días.";
  }

  if (daysVal > maxDays) {
    showError(daysInput, msg);
    return false;
  }

  return true;
}

function showError(input, message) {
  input.classList.add("border-red-500", "ring-2", "ring-red-200");
  input.classList.remove("border-gray-300");

  let parent = input.parentNode;
  let existingError = parent.querySelector(".error-msg");
  if (!existingError) {
    const p = document.createElement("p");
    p.className = "error-msg text-red-500 text-xs mt-1 font-bold animate-pulse";
    p.innerText = message;
    parent.appendChild(p);
  }
}

function clearErrors() {
  const inputs = document.querySelectorAll("input, select");
  inputs.forEach((input) => {
    input.classList.remove("border-red-500", "ring-2", "ring-red-200");
    input.classList.add("border-gray-300");
  });

  const messages = document.querySelectorAll(".error-msg");
  messages.forEach((msg) => msg.remove());
}
