// Al cargar la página, verificamos si ya hay datos guardados
document.addEventListener("DOMContentLoaded", () => {
  const storedData = sessionStorage.getItem("userData");

  if (storedData) {
    const userData = JSON.parse(storedData);

    // Función auxiliar para rellenar solo si el input existe
    const setVal = (id, val) => {
      const input = document.getElementById(id);
      if (input) input.value = val || "";
    };

    // Rellenamos los campos
    setVal("name", userData.name);
    setVal("dateIn", userData.dateIn);
    setVal("rfc", userData.rfc);
    setVal("salary", userData.salary);
    setVal("dept", userData.dept);
    setVal("curp", userData.curp);
    setVal("days", userData.days);
    setVal("role", userData.role);
    setVal("nss", userData.nss);
    setVal("period", userData.period);
  }
});

function startFlow(flowType) {
  if (!validateEmployeeForm()) {
    return;
  }

  // Recolectamos los datos del HTML
  const userData = {
    name: document.getElementById("name").value,
    dateIn: document.getElementById("dateIn").value,
    rfc: document.getElementById("rfc").value,
    salary: document.getElementById("salary").value, // Se guarda como string, se convierte después
    dept: document.getElementById("dept").value,
    curp: document.getElementById("curp").value,
    days: document.getElementById("days").value,
    role: document.getElementById("role").value,
    nss: document.getElementById("nss").value,
    period: document.getElementById("period").value,
    motivoBaja: "renuncia_voluntaria" // Default por si es finiquito
  };

  // Guardamos en sessionStorage
  sessionStorage.setItem("currentFlowType", flowType); // 'paysheet' o 'settlement'
  sessionStorage.setItem("userData", JSON.stringify(userData));
  
  // Marca paso 1 como completado
  sessionStorage.setItem("step_userData_completed", "true");

  // Redireccionamos a la siguiente página según el flujo
  if (flowType === "paysheet") {
    window.location.href = "paysheetPerceptions.html";
  } else {
    window.location.href = "settlementPerceptions.html";
  }
}

// Hacemos la función global para que el onclick del HTML la encuentre
window.startFlow = startFlow;