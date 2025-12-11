const API_URL = "http://localhost:3000/api";

const mapFlowType = (flow) => {
    if (flow === 'paysheet') return 'nomina';
    if (flow === 'settlement') return 'finiquito';
    return flow;
};

const services = {
    
    /**
     * Paso 1: Calcular Percepciones
     * @param {string} flowType - 'paysheet' o 'settlement'
     * @param {object} data - Datos del formulario (UserData + Inputs Percepciones)
     */

    async calculatePerceptions(flowType, data) {
        const type = mapFlowType(flowType);
        try {
            const response = await fetch(`${API_URL}/calcular-percepciones?tipo=${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.mensaje || "Error al calcular percepciones");
            }
            return result;

        } catch (error) {
            console.error("Service Error:", error);
            throw error;
        }
    },

    /**
     * Paso 2: Calcular Deducciones
     * @param {string} flowType - 'paysheet' o 'settlement'
     * @param {object} data - Datos acumulados (Resultados Paso 1 + Inputs Deducciones)
     */

    async calculateDeductions(flowType, data) {
        const type = mapFlowType(flowType);
        try {
            const response = await fetch(`${API_URL}/calcular-deducciones?tipo=${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.mensaje || "Error al calcular deducciones");
            }
            return result;

        } catch (error) {
            console.error("Service Error:", error);
            throw error;
        }
    },

    /**
     * Paso 3: Resumen Final (Estructurar Nómina/Finiquito)
     * @param {string} flowType - 'paysheet' o 'settlement'
     * @param {object} finalData - Objeto con totales, arrays de percepciones/deducciones y detalles
     */

    async calculateSummary(flowType, finalData) {
        const type = mapFlowType(flowType);
        // El endpoint cambia según el tipo porque la lógica de estructura final es distinta
        const endpoint = type === 'nomina' ? '/calcular-nomina' : '/calcular-finiquito';

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.mensaje || "Error al generar el resumen final");
            }
            return result;

        } catch (error) {
            console.error("Service Error:", error);
            throw error;
        }
    },

    /**
     * Generar y Descargar Documentos (PDF o Excel)
     * @param {string} format - 'pdf' o 'excel'
     * @param {string} flowType - 'paysheet' o 'settlement'
     * @param {object} datosCalculo - El JSON final que se obtuvo en el Paso 3
     */

    async downloadDocument(format, flowType, datosCalculo) {
        const type = mapFlowType(flowType);
        const endpoint = format === 'pdf' ? '/generar-pdf' : '/generar-excel';

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: type,
                    datosCalculo: datosCalculo
                })
            });

            if (!response.ok) {
                const errorJson = await response.json();
                throw new Error(errorJson.mensaje || `Error al generar ${format}`);
            }

            // Convertimos la respuesta en un Blob (archivo binario)
            const blob = await response.blob();
            
            // Creamos un link invisible para forzar la descarga en el navegador
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // Asignamos extensión correcta
            a.download = `Reporte_${type}_${new Date().getTime()}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url); // Limpiamos memoria

            return true;

        } catch (error) {
            console.error("Download Error:", error);
            throw error;
        }
    }
};

export default services;