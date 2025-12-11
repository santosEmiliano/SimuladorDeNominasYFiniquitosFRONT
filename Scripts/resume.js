import services from './services.js';

document.addEventListener("DOMContentLoaded", () => {
    initResume();
});

async function initResume() {
    const flowType = sessionStorage.getItem("currentFlowType") || "paysheet";
    const mainContainer = document.querySelector("main");

    // 1. Recuperar datos previos
    const step1Data = JSON.parse(sessionStorage.getItem("step_perceptions_data"));
    const step2Data = JSON.parse(sessionStorage.getItem("step_deductions_data"));
    const userData = JSON.parse(sessionStorage.getItem("userData"));

    if (!step1Data || !step2Data) {
        Swal.fire("Error", "No hay datos calculados. Regresa al inicio.", "error");
        return;
    }

    // Mostrar "Cargando..."
    mainContainer.innerHTML = `
        <div class="flex flex-col items-center justify-center h-64 space-y-4">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p class="text-gray-500 font-medium">Generando resumen final...</p>
        </div>
    `;

    try {
        // 2. Armar el objeto final para el Backend
        // Combinamos lo que ya tenemos. El backend espera recibir los arrays completos.
        const finalPayload = {
            totalPercepciones: step1Data.totalPercepciones,
            totalDeducciones: step2Data.totalDeducciones,
            percepciones: step1Data.percepciones, // Array detallado
            deducciones: step2Data.deducciones,   // Array detallado
            detallesCalculo: {
                ...step1Data.detallesCalculo,
                ...step2Data.detallesCalculo
            }
        };

        // 3. Obtener el Resumen Oficial del Backend
        const resumen = await services.calculateSummary(flowType, finalPayload);
        
        // Guardamos el resultado final para usarlo en las descargas
        sessionStorage.setItem("final_summary_data", JSON.stringify(resumen));

        // 4. Renderizar la Vista
        renderResumeView(mainContainer, resumen, userData, flowType);

    } catch (error) {
        console.error(error);
        mainContainer.innerHTML = `
            <div class="text-center p-10 text-red-500">
                <h3 class="text-xl font-bold">Error al cargar el resumen</h3>
                <p>${error.message}</p>
            </div>`;
    }
}

// ==========================================
// RENDERIZADO DE UI (HTML EN JS)
// ==========================================

function renderResumeView(container, data, user, flowType) {
    const esFiniquito = flowType === 'settlement';
    const titulo = esFiniquito ? "Resumen de Finiquito" : "Resumen de Nómina";
    
    // Formateador de moneda
    const money = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

    // Generar filas de tablas
    const rowsPercepciones = data.percepciones.map(p => `
        <div class="flex justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 transition">
            <span class="text-gray-700 text-sm">${p.concepto}</span>
            <span class="font-semibold text-gray-900 text-sm">${money(p.monto)}</span>
        </div>
    `).join('');

    const rowsDeducciones = data.deducciones.map(d => `
        <div class="flex justify-between py-2 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 transition">
            <span class="text-gray-700 text-sm">${d.concepto}</span>
            <span class="font-semibold text-red-600 text-sm">${money(d.monto)}</span>
        </div>
    `).join('');

    // HTML PRINCIPAL
    container.innerHTML = `
    <div class="max-w-6xl mx-auto p-6 space-y-8 animate-fade-in-up">
        
        <div class="text-center space-y-2">
            <h2 class="text-3xl font-bold text-gray-800">${titulo}</h2>
            <p class="text-gray-500">Empleado: <span class="font-semibold text-blue-600">${user.name}</span> | RFC: ${user.rfc}</p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="bg-green-50 px-6 py-4 border-b border-green-100 flex justify-between items-center">
                    <h3 class="font-bold text-green-800">Percepciones</h3>
                    <span class="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full font-bold">+ Ingresos</span>
                </div>
                <div class="p-4 space-y-1">
                    ${rowsPercepciones}
                </div>
                <div class="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                    <span class="font-bold text-gray-600">Total Percepciones</span>
                    <span class="font-bold text-green-700 text-lg">${money(data.totalPercepciones)}</span>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="bg-red-50 px-6 py-4 border-b border-red-100 flex justify-between items-center">
                    <h3 class="font-bold text-red-800">Deducciones</h3>
                    <span class="bg-red-200 text-red-800 text-xs px-2 py-1 rounded-full font-bold">- Retenciones</span>
                </div>
                <div class="p-4 space-y-1">
                    ${rowsDeducciones}
                </div>
                <div class="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                    <span class="font-bold text-gray-600">Total Deducciones</span>
                    <span class="font-bold text-red-700 text-lg">${money(data.totalDeducciones)}</span>
                </div>
            </div>

        </div>

        <div class="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 text-white flex flex-col md:flex-row justify-between items-center">
            <div>
                <p class="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Total Neto a Recibir</p>
                <h2 class="text-4xl font-bold">${money(data.netoPagar)}</h2>
                ${data.mensajeAlerta ? `<p class="text-yellow-300 text-sm mt-2"><i class="fas fa-exclamation-triangle"></i> ${data.mensajeAlerta}</p>` : ''}
            </div>
            
            <div class="mt-6 md:mt-0 flex gap-4">
                <button id="btnPdf" class="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-bold shadow transition flex items-center gap-2">
                    📄 Descargar PDF
                </button>
                <button id="btnExcel" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-bold shadow transition flex items-center gap-2">
                    📊 Descargar Excel
                </button>
            </div>
        </div>

        <div class="text-center pt-8">
            <a href="UserData.html" onclick="sessionStorage.clear()" class="text-gray-400 hover:text-gray-600 text-sm underline transition">
                Calcular otro empleado (Reiniciar)
            </a>
        </div>

    </div>
    `;

    // ACTIVAR BOTONES
    document.getElementById("btnPdf").addEventListener("click", () => handleDownload('pdf', flowType));
    document.getElementById("btnExcel").addEventListener("click", () => handleDownload('excel', flowType));
}

// ==========================================
// MANEJO DE DESCARGAS
// ==========================================

async function handleDownload(format, flowType) {
    const finalData = JSON.parse(sessionStorage.getItem("final_summary_data"));
    const userData = JSON.parse(sessionStorage.getItem("userData"));
    const step1Data = JSON.parse(sessionStorage.getItem("step_perceptions_data"));

    // Preparamos el objeto completo que espera el generador de documentos
    // (Necesita mezclar datos de cálculo + datos del empleado como fechas, rfc, etc)
    const datosCompletos = {
        ...finalData,
        datosExtra: {
            ...userData,
            // Agregamos fechas importantes para el recibo
            fechaIngreso: userData.dateIn,
            fechaSalida: userData.dateOut || new Date().toISOString().split('T')[0], // Para finiquito
            diasSalarioPendientes: userData.days
        }
    };

    const btnId = format === 'pdf' ? 'btnPdf' : 'btnExcel';
    const btn = document.getElementById(btnId);
    const originalText = btn.innerText;

    try {
        btn.innerText = "⏳ Descargando...";
        btn.disabled = true;
        btn.classList.add("opacity-75", "cursor-wait");

        await services.downloadDocument(format, flowType, datosCompletos);

        Swal.fire({
            icon: 'success',
            title: 'Descarga iniciada',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });

    } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo descargar el archivo.", "error");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
        btn.classList.remove("opacity-75", "cursor-wait");
    }
}