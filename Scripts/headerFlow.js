document.addEventListener("DOMContentLoaded", () => {
  manageHeaderState();
});

function manageHeaderState() {
  const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";

  const step1Completed =
    sessionStorage.getItem("step_userData_completed") === "true";
  const step2Completed =
    sessionStorage.getItem("step_perceptions_completed") === "true";
  const step3Completed =
    sessionStorage.getItem("step_deductions_completed") === "true";

  const path = window.location.pathname;

  const isPerceptionsPage = path.includes("Perceptions.html");
  const isDeductionsPage = path.includes("Deductions.html");
  const isResumePage = path.includes("Resume.html");
  const isUserDataPage = path.includes("UserData.html");

  let forceBlock = false;
  if (isUserDataPage) {
    forceBlock = true;
  }

  const linkPerceptions = document.getElementById("nav-perceptions");
  const linkDeductions = document.getElementById("nav-deductions");
  const linkResume = document.getElementById("nav-resume");

  if (linkPerceptions) {
    const isAheadOfPerceptions = isDeductionsPage || isResumePage;

    if (
      (step1Completed || isPerceptionsPage || isAheadOfPerceptions) &&
      !forceBlock
    ) {
      enableLink(linkPerceptions, `${flowType}Perceptions.html`);
    } else {
      disableLink(linkPerceptions);
    }
  }

  if (linkDeductions) {
    const isAheadOfDeductions = isResumePage;

    if (
      (step2Completed || isDeductionsPage || isAheadOfDeductions) &&
      !forceBlock
    ) {
      enableLink(linkDeductions, `${flowType}Deductions.html`);
    } else {
      disableLink(linkDeductions);
    }
  }

  if (linkResume) {
    if ((step3Completed || isResumePage) && !forceBlock) {
      enableLink(linkResume, `${flowType}Resume.html`);
    } else {
      disableLink(linkResume);
    }
  }
  highlightCurrentPage();
}

function enableLink(element, destinationUrl) {
  if (!element) return;
  element.href = destinationUrl;
  element.classList.remove(
    "text-gray-400",
    "cursor-not-allowed",
    "pointer-events-none"
  );
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
  element.classList.add(
    "text-gray-400",
    "cursor-not-allowed",
    "pointer-events-none"
  );
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
    link.classList.remove("border-b-2", "border-gray-800", "text-blue-600");
    if (
      link.getAttribute("href") &&
      currentPath.includes(link.getAttribute("href"))
    ) {
      link.classList.add("border-b-2", "border-gray-800");
    }
  });
}
