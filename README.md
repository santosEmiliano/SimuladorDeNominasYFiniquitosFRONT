# Simulador de Nómina y Finiquitos - Frontend

Interfaz web interactiva para el cálculo y simulación de nóminas y finiquitos bajo la legislación mexicana vigente (2025). Permite la captura de datos, cálculo en tiempo real y descarga de recibos.

## 🚀 Tecnologías Utilizadas

* **HTML5**: Estructura semántica de las páginas.
* **TailwindCSS**: Framework de estilos (vía CDN) para diseño responsivo.
* **JavaScript (ES6 Modules)**: Lógica del cliente, manejo de sesión y consumo de API.
* **SweetAlert2**: Librería para alertas y notificaciones visuales.

## 📋 Requisitos

* Navegador web moderno (Chrome, Firefox, Edge).
* Conexión a internet (para cargar las librerías CDN de Tailwind y SweetAlert).
* **Servidor Local (Live Server):** Debido al uso de módulos (`type="module"`), el proyecto requiere ser ejecutado sobre un servidor HTTP local.

## 🛠️ Instalación y Uso

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL_TU_REPO_FRONTEND>
    cd SimuladorDeNominasYFiniquitosFRONT
    ```

2.  **Configurar Conexión:**
    Verifica que la URL del backend sea correcta en el archivo `Scripts/services.js`:
    ```javascript
    const API_URL = "http://localhost:3000/api";
    ```

3.  **Ejecutar la Aplicación:**
    > **IMPORTANTE:** No abras los archivos `.html` haciendo doble clic desde la carpeta (protocolo `file://`). Debes usar un servidor local (`http://`).

    * **Opción A (VS Code):** Instala la extensión **Live Server**. Haz clic derecho en `Pages/UserData.html` y selecciona "Open with Live Server".
    * **Opción B (Python):** Abre una terminal en la carpeta del proyecto y ejecuta: `python -m http.server`.
    * **Opción C (Node):** Usa paquetes como `http-server`.

4.  **Flujo de Uso:**
    1.  Ingresa los **Datos del Empleado** (Salario, Fecha Ingreso, etc.).
    2.  Selecciona el tipo de cálculo: **Nómina** o **Finiquito**.
    3.  Calcula **Percepciones** (Sueldo, Horas Extra, Aguinaldo, Bonos).
    4.  Calcula **Deducciones** (ISR, IMSS, Préstamos).
    5.  Visualiza el **Resumen** y descarga el PDF o Excel.

## ✨ Características

* **Persistencia de Datos:** Uso de `SessionStorage` para mantener la información al recargar o navegar entre pasos.
* **Calculadoras en Tiempo Real:** Visualiza cambios en el monto de aguinaldo, vacaciones y horas extra mientras escribes.
* **Validación de Formularios:** Retroalimentación visual en campos requeridos.
* **Diseño Modular:** Scripts separados para mejor mantenimiento (`perceptions.js`, `deducciones.js`, `resume.js`).

## 📂 Estructura del Proyecto

```text
├── Pages/          # Vistas HTML (UserData, Perceptions, Deductions, Resume)
├── Scripts/        # Lógica JavaScript
│   ├── index.js    # Lógica inicial
│   ├── services.js # Conexión fetch con el Backend
│   ├── ...         # Controladores de vista
└── src/            # Recursos estáticos (imágenes)
```