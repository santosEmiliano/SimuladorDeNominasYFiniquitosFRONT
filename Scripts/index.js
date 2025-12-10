/**
 * Función principal para iniciar el flujo de cálculo.
 * Se activa desde los botones en UserData.html
 * @param {string} flowType - Puede ser 'paysheet' (Nómina) o 'settlement' (Finiquito)
 */
function startFlow(flowType) {
  // 1. Obtener el formulario
  const form = document.getElementById("employeeForm");

  // 2. Validar que todos los campos requeridos estén llenos
  // checkValidity() es nativo de HTML5, verifica 'required', tipos de dato, etc.
  if (!form.checkValidity()) {
    form.reportValidity(); // Muestra las burbujas de error del navegador
    return; // Detener ejecución si hay errores
  }

  // 3. Recolectar datos del DOM
  // Usamos nombres de variables en Inglés para mantener consistencia
  const employeeData = {
    name: document.getElementById("name").value,
    startDate: document.getElementById("dateIn").value, // Fecha ingreso
    rfc: document.getElementById("rfc").value,
    dailySalary: parseFloat(document.getElementById("salary").value), // Salario diario
    department: document.getElementById("dept").value,
    curp: document.getElementById("curp").value,
    workedDays: parseInt(document.getElementById("days").value), // Días trabajados
    position: document.getElementById("role").value, // Puesto
    nss: document.getElementById("nss").value,
    periodicity: document.getElementById("period").value, // Periodicidad
  };

  // 4. Guardar en SessionStorage (Para que se borre al cerrar navegador)
  // Guardamos los datos del empleado para usarlos en los cálculos siguientes
  sessionStorage.setItem("employeeData", JSON.stringify(employeeData));

  // Guardamos el TIPO DE FLUJO ('paysheet' o 'settlement')
  // Esto es vital para saber qué HTML cargar en los siguientes pasos
  sessionStorage.setItem("currentFlowType", flowType);

  // 5. Manejo de Semáforos (Header)
  // Marcamos el paso 1 como COMPLETADO para desbloquear el siguiente link
  sessionStorage.setItem("step_userData_completed", "true");

  // IMPORTANTE: Limpiamos los pasos futuros por seguridad.
  // Si el usuario tenía una sesión previa y regresó al inicio,
  // no queremos que tenga desbloqueado el final sin pasar por el medio.
  sessionStorage.removeItem("step_perceptions_completed");
  sessionStorage.removeItem("step_deductions_completed");

  // 6. Redirección Dinámica
  // Dependiendo del botón que presionó, lo mandamos a la página correspondiente
  if (flowType === "paysheet") {
    window.location.href = "paysheetPerceptions.html";
  } else {
    window.location.href = "settlementPerceptions.html";
  }
}
