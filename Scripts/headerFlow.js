document.addEventListener("DOMContentLoaded", () => {
  manageHeaderState();
});

function manageHeaderState() {
  // Recuperamos el flujo actual (paysheet o settlement) y el estado de los pasos
  const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";

  const step1Completed = sessionStorage.getItem("step_userData_completed") === "true";
  const step2Completed = sessionStorage.getItem("step_perceptions_completed") === "true";
  const step3Completed = sessionStorage.getItem("step_deductions_completed") === "true";

  const path = window.location.pathname;

  // Detectamos dónde estamos para saber qué está "adelante"
  const isPerceptionsPage = path.includes("Perceptions.html");
  const isDeductionsPage = path.includes("Deductions.html");
  const isResumePage = path.includes("Resume.html");

  // Referencias al DOM
  const linkPerceptions = document.getElementById("nav-perceptions");
  const linkDeductions = document.getElementById("nav-deductions");
  const linkResume = document.getElementById("nav-resume");

  // --- LÓGICA DE NAVEGACIÓN ---

  // Enlace a PERCEPCIONES
  // Se habilita si: Completaste paso 1 o ya estás en percepciones o estás más adelante
  if (linkPerceptions) {
    const canAccess = step1Completed || isPerceptionsPage || isDeductionsPage || isResumePage;

    if (canAccess) {
      enableLink(linkPerceptions, `${flowType}Perceptions.html`);
    } else {
      disableLink(linkPerceptions);
    }
  }

  // Enlace a DEDUCCIONES
  // Se habilita si: Completaste paso 2 o ya estás en deducciones o estás más adelante
  if (linkDeductions) {
    const canAccess = step2Completed || isDeductionsPage || isResumePage;

    if (canAccess) {
      enableLink(linkDeductions, `${flowType}Deductions.html`);
    } else {
      disableLink(linkDeductions);
    }
  }

  // Enlace a RESUMEN
  // Se habilita si: Completaste paso 3 o ya estás en resumen
  if (linkResume) {
    const canAccess = step3Completed || isResumePage;

    if (canAccess) {
      enableLink(linkResume, `${flowType}Resume.html`);
    } else {
      disableLink(linkResume);
    }
  }

  highlightCurrentPage();
}

// --- FUNCIONES VISUALES ---

function enableLink(element, destinationUrl) {
  if (!element) return;
  element.href = destinationUrl;
  
  // Quitamos estilos de deshabilitado
  element.classList.remove(
    "text-gray-400",
    "cursor-not-allowed",
    "pointer-events-none"
  );
  
  // Agregamos estilos de habilitado (negro y pointer)
  element.classList.add(
    "text-black",
    "hover:underline",
    "cursor-pointer",
    "font-semibold"
  );
}

function disableLink(element) {
  if (!element) return;
  element.removeAttribute("href");
  
  // Agregamos estilos de deshabilitado (gris y bloqueado)
  element.classList.add(
    "text-gray-400",
    "cursor-not-allowed",
    "pointer-events-none"
  );
  
  // Quitamos estilos de habilitado
  element.classList.remove(
    "text-black",
    "hover:underline",
    "cursor-pointer",
    "font-semibold",
    "border-b-2",
    "border-gray-800"
  );
}

function highlightCurrentPage() {
  const currentPath = window.location.pathname;
  const allLinks = document.querySelectorAll("nav a");

  allLinks.forEach((link) => {
    // Limpiamos estilos activos previos
    link.classList.remove("border-b-2", "border-gray-800");

    // Si la URL del link coincide con la página actual, lo marcamos
    const href = link.getAttribute("href");
    if (href && currentPath.includes(href)) {
      link.classList.add("border-b-2", "border-gray-800");
    }
  });
}