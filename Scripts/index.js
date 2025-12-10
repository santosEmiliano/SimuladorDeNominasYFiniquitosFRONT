function startFlow(flowType) {
  if (typeof validateEmployeeForm !== "function") {
    console.error("Error: No se encontró validateEmployeeForm");
    const form = document.getElementById("employeeForm");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
  } else {
    if (!validateEmployeeForm()) {
      return;
    }
  }

  Swal.fire({
    title: "Datos validados",
    text: "Procesando información del empleado...",
    icon: "success",
    timer: 1500,
    showConfirmButton: false,
    willClose: () => {
      processAndRedirect(flowType);
    },
  });
}

function processAndRedirect(flowType) {
  const employeeData = {
    name: document.getElementById("name").value,
    startDate: document.getElementById("dateIn").value,
    rfc: document.getElementById("rfc").value,
    dailySalary: parseFloat(document.getElementById("salary").value),
    department: document.getElementById("dept").value,
    curp: document.getElementById("curp").value,
    workedDays: parseInt(document.getElementById("days").value),
    position: document.getElementById("role").value,
    nss: document.getElementById("nss").value,
    periodicity: document.getElementById("period").value,
  };

  sessionStorage.setItem("employeeData", JSON.stringify(employeeData));
  sessionStorage.setItem("userData", JSON.stringify(employeeData));

  sessionStorage.setItem("currentFlowType", flowType);
  sessionStorage.setItem("step_userData_completed", "true");

  sessionStorage.removeItem("step_perceptions_completed");
  sessionStorage.removeItem("step_deductions_completed");

  if (flowType === "paysheet") {
    window.location.href = "paysheetPerceptions.html";
  } else {
    window.location.href = "settlementPerceptions.html";
  }
}
