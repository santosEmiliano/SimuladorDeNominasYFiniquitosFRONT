import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar UI de dinámicos
    initDynamicDeductions();
    
    // Cargar datos del paso anterior (importante para la Base Gravable)
    loadPreviousStepData();

    // Restaurar estado de checkboxes e inputs fijos (Infonavit, etc)
    restoreDeductionInputsState();
    
    // Activar calculadoras y listeners de guardado
    initLocalCalculators(); 

    // Pre-calcular impuestos estándar (ISR/IMSS)
    previewStandardDeductions();

    // Listener del botón Siguiente
    const btnSubmit = document.querySelector('button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.addEventListener("click", handleCalculateDeductions);
    }
});

// ==========================================
// PERSISTENCIA Y RESTAURACIÓN (NUEVO)
// ==========================================

function saveDeductionInputsState() {
    const state = {
        // Infonavit
        infonavitCheck: document.getElementById("infonavitCheck")?.checked || false,
        infonavitPct: document.getElementById("DeductionsPercentageInfontavit")?.value || "",
        infonavitFixed: document.getElementById("DeductionsFixedFeeInfonavit")?.value || "",
        
        // Pensión
        maintenanceCheck: document.getElementById("maintenanceCheck")?.checked || false,
        maintenancePct: document.getElementById("DeductionsPercentageMaintenance")?.value || "",
        maintenanceFixed: document.getElementById("DeductionsFixedFeeMaintenance")?.value || "",

        // Fonacot
        fonacotCheck: document.getElementById("FonacotCheck")?.checked || false,
        fonacotPct: document.getElementById("DeductionsPercentageFonacot")?.value || "",
        fonacotFixed: document.getElementById("DeductionsFixedFeeFonacot")?.value || "",

        // ISN
        isnCheck: document.getElementById("ApplyISN")?.checked || false
    };
    sessionStorage.setItem("deductions_inputs", JSON.stringify(state));
}

function restoreDeductionInputsState() {
    const stateJSON = sessionStorage.getItem("deductions_inputs");
    if (!stateJSON) return;

    const state = JSON.parse(stateJSON);

    // Helper para restaurar un bloque completo
    const restoreBlock = (checkId, pctId, fixId, totalId, savedCheck, savedPct, savedFix) => {
        const elCheck = document.getElementById(checkId);
        const elPct = document.getElementById(pctId);
        const elFix = document.getElementById(fixId);

        if (elCheck) elCheck.checked = savedCheck;
        if (elPct) elPct.value = savedPct;
        if (elFix) elFix.value = savedFix;

        // Disparamos el cálculo visual inmediato
        calculateRow(checkId, pctId, fixId, totalId);
    };

    // Restauramos cada sección
    restoreBlock(
        "infonavitCheck", "DeductionsPercentageInfontavit", "DeductionsFixedFeeInfonavit", "DeductionsTotalInfonavit",
        state.infonavitCheck, state.infonavitPct, state.infonavitFixed
    );

    restoreBlock(
        "maintenanceCheck", "DeductionsPercentageMaintenance", "DeductionsFixedFeeMaintenance", "DeductionsTotalMaintenance",
        state.maintenanceCheck, state.maintenancePct, state.maintenanceFixed
    );

    restoreBlock(
        "FonacotCheck", "DeductionsPercentageFonacot", "DeductionsFixedFeeFonacot", "DeductionsTotalFonacot",
        state.fonacotCheck, state.fonacotPct, state.fonacotFixed
    );

    // ISN
    const isnCheck = document.getElementById("ApplyISN");
    if (isnCheck) isnCheck.checked = state.isnCheck;
}

// ==========================================
// CALCULADORAS LOCALES
// ==========================================

function initLocalCalculators() {
    // Configura los listeners para calcular Y guardar al mismo tiempo
    const setupCalc = (checkId, pctId, fixId, totalId) => {
        const inputs = [
            document.getElementById(checkId), 
            document.getElementById(pctId), 
            document.getElementById(fixId)
        ];
        
        inputs.forEach(el => {
            if (el) {
                // Al escribir o cambiar checkbox: Calculamos y Guardamos
                const eventType = el.type === 'checkbox' ? 'change' : 'input';
                el.addEventListener(eventType, () => {
                    calculateRow(checkId, pctId, fixId, totalId);
                    saveDeductionInputsState(); 
                });
            }
        });
    };

    setupCalc("infonavitCheck", "DeductionsPercentageInfontavit", "DeductionsFixedFeeInfonavit", "DeductionsTotalInfonavit");
    setupCalc("maintenanceCheck", "DeductionsPercentageMaintenance", "DeductionsFixedFeeMaintenance", "DeductionsTotalMaintenance");
    setupCalc("FonacotCheck", "DeductionsPercentageFonacot", "DeductionsFixedFeeFonacot", "DeductionsTotalFonacot");

    // Listener especial para ISN
    const isnCheck = document.getElementById("ApplyISN");
    if (isnCheck) {
        isnCheck.addEventListener("change", saveDeductionInputsState);
    }
}

function calculateRow(checkId, pctId, fixId, totalId) {
    const isChecked = document.getElementById(checkId)?.checked;
    const output = document.getElementById(totalId);
    
    if (!isChecked) {
        if (output) output.innerText = "$0.00";
        return;
    }

    const pct = Number(document.getElementById(pctId)?.value) || 0;
    const fixed = Number(document.getElementById(fixId)?.value) || 0;
    const base = Number(document.getElementById("DeductionsGravado").value) || 0;

    const total = (base * (pct / 100)) + fixed;
    if (output) output.innerText = `$${total.toFixed(2)}`;
}

// ==========================================
// PRE-CÁLCULO SILENCIOSO (ISR/IMSS)
// ==========================================
async function previewStandardDeductions() {
    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    const payload = buildPayload(flowType, []); 
    
    if (!payload) return; 

    try {
        const result = await services.calculateDeductions(flowType, payload);
        if (result.detallesCalculo) {
            const isrVal = result.detallesCalculo.isrDeterminado || result.detallesCalculo.isrOrdinario || 0;
            updateInputCurrency("DeductionsISR", isrVal);
            updateInputCurrency("DeductionsISRN", isrVal); 
            const imssVal = result.detallesCalculo.imssDeterminado || 0;
            updateInputCurrency("DeductionsIMSS", imssVal);
        }
    } catch (error) {
        console.warn("Pre-cálculo visual:", error);
    }
}

function updateInputCurrency(id, value) {
    const input = document.getElementById(id);
    if (input) input.value = value.toFixed(2);
}

// ==========================================
// ENVÍO DE DATOS
// ==========================================

async function handleCalculateDeductions(e) {
    e.preventDefault();

    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    
    // Aseguramos guardar el estado final antes de salir
    saveDeductionInputsState();

    const listaAdeudos = collectAllDeductions();
    const payload = buildPayload(flowType, listaAdeudos);

    if (!payload) {
        Swal.fire("Error", "Faltan datos de los pasos anteriores.", "error");
        return;
    }

    try {
        const btn = e.target;
        btn.innerText = "Calculando...";
        btn.disabled = true;

        const result = await services.calculateDeductions(flowType, payload);

        sessionStorage.setItem("step_deductions_data", JSON.stringify(result));
        sessionStorage.setItem("step_deductions_completed", "true");

        const nextUrl = flowType === 'paysheet' ? 'paysheetResume.html' : 'settlementResume.html';
        window.location.href = nextUrl;

    } catch (error) {
        console.error(error);
        Swal.fire({ icon: 'error', title: 'Error', text: error.message });
        e.target.innerText = "Ve el resúmen de tu nómina";
        e.target.disabled = false;
    }
}

function buildPayload(flowType, listaAdeudos) {
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const step1Data = JSON.parse(sessionStorage.getItem("step_perceptions_data"));

    if (!userData || !step1Data) return null;

    if (flowType === 'paysheet') {
        return {
            salarioDiario: Number(userData.salary),
            diasPeriodo: userData.period === 'Semanal' ? 7 : userData.period === 'Quincenal' ? 15 : 30,
            faltas: 0, 
            baseGravableISR: step1Data.baseGravableISR,
            sbcCalculado: step1Data.sbcCalculado,
            adeudos: listaAdeudos
        };
    } else {
        return {
            baseGravableOrdinaria: step1Data.detallesCalculo.baseGravableOrdinaria,
            baseGravableSeparacion: step1Data.detallesCalculo.baseGravableSeparacion,
            adeudos: listaAdeudos
        };
    }
}

// ==========================================
// UTILERIAS
// ==========================================

function loadPreviousStepData() {
    const step1Data = JSON.parse(sessionStorage.getItem("step_perceptions_data"));
    if (!step1Data) return;

    const inputGravado = document.getElementById("DeductionsGravado");
    if (inputGravado) {
        const gravadoTotal = step1Data.baseGravableISR 
            || ((step1Data.detallesCalculo?.baseGravableOrdinaria || 0) + (step1Data.detallesCalculo?.baseGravableSeparacion || 0));
        inputGravado.value = gravadoTotal.toFixed(2);
    }
}

function getMoneyValue(elementId) {
    const el = document.getElementById(elementId);
    if (!el) return 0;
    return Number(el.innerText.replace(/[^0-9.-]+/g,"")) || 0;
}

function collectAllDeductions() {
    let adeudos = [];

    // Dinámicos
    const container = document.getElementById("deductionsContainer");
    if (container) {
        for (let row of container.children) {
            const monto = Number(row.querySelector(".deductionTotal")?.value.replace('$','')) || 0;
            if (monto > 0) {
                adeudos.push({ nombre: "Deducción Personalizada", deduccion: monto });
            }
        }
    }

    // Fijos (Checkboxes)
    const checkDeduction = (checkId, totalId, label) => {
        if (document.getElementById(checkId)?.checked) {
            const total = getMoneyValue(totalId);
            if (total > 0) adeudos.push({ nombre: label, deduccion: total });
        }
    };
    checkDeduction("infonavitCheck", "DeductionsTotalInfonavit", "INFONAVIT");
    checkDeduction("maintenanceCheck", "DeductionsTotalMaintenance", "Pensión Alimenticia");
    checkDeduction("FonacotCheck", "DeductionsTotalFonacot", "FONACOT");

    // ISN
    if (document.getElementById("ApplyISN")?.checked) {
         const base = Number(document.getElementById("DeductionsGravado").value) || 0;
         const isn = base * 0.02; 
         if(isn > 0) adeudos.push({ nombre: "ISN (Retenido)", deduccion: Number(isn.toFixed(2)) });
    }

    return adeudos;
}

function initDynamicDeductions() {
    const btn = document.getElementById("addDeductionBtn");
    if (!btn) return;

    btn.addEventListener("click", function () {
        const wrap = document.createElement("div");
        wrap.className = "border rounded-xl p-6 bg-white shadow max-w-3xl mx-auto space-y-4 mb-4 relative";
        
        wrap.innerHTML = `
            <div class="flex justify-between items-center">
                 <label class="font-semibold text-gray-700">Deducción personalizada</label>
                 <button type="button" class="deleteDeduction text-red-500 hover:text-red-700 text-sm font-bold">Eliminar</button>
            </div>
            <div class="grid grid-cols-3 gap-6 mt-2">
                <label class="font-medium">Porcentaje: <input class="deductionPercentage mt-1 border rounded-lg p-2 w-full" type="number" min="0" placeholder="0" /></label>
                <label class="font-medium">Cuota Fija: <input class="deductionFixed mt-1 border rounded-lg p-2 w-full" type="number" min="0" placeholder="0" /></label>
                <label class="font-medium">Total: <input class="deductionTotal mt-1 border rounded-lg p-2 w-full bg-gray-50" type="text" readonly value="$0.00" /></label>
            </div>
        `;
        document.getElementById("deductionsContainer").appendChild(wrap);

        const inputs = wrap.querySelectorAll("input:not([readonly])");
        inputs.forEach(inp => inp.addEventListener("input", () => {
             const pct = Number(wrap.querySelector(".deductionPercentage").value) || 0;
             const fixed = Number(wrap.querySelector(".deductionFixed").value) || 0;
             const base = Number(document.getElementById("DeductionsGravado").value) || 0;
             const total = (base * (pct / 100)) + fixed;
             wrap.querySelector(".deductionTotal").value = total.toFixed(2);
        }));

        wrap.querySelector(".deleteDeduction").addEventListener("click", () => wrap.remove());
    });
}