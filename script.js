// Número del negocio: código de país + número, solo dígitos.
// WhatsApp de contacto del negocio (Perú).
const NUMERO_WHATSAPP = "51934181908";

const formulario = document.querySelector("#form-contacto");

// Este archivo se carga en todas las páginas.
// Solo activamos el formulario cuando existe.
if (formulario) {
    const consulta = document.querySelector("#consulta");
    const datosCita = document.querySelector("#datos-cita");
    const fecha = document.querySelector("#fecha");
    const resultado = document.querySelector("#resultado-contacto");
    const vistaMensaje = document.querySelector("#vista-mensaje");
    const enlaceWhatsApp = document.querySelector("#enlace-whatsapp");
    const estado = document.querySelector("#estado-contacto");

    const serviciosPorCodigo = new Map([
        ["corte", "Corte de cabello"],
        ["barba", "Perfilado de barba"],
        ["combo", "Corte y barba"],
        ["semiondulacion", "Semiondulación"],
        ["coloracion", "Coloración de cabello"],
        ["mechas", "Mechas y reflejos"],
    ]);
    const servicios = [...serviciosPorCodigo.values()];

    // Son comprobaciones de calidad del mensaje, no autenticación ni reservas.
    const motivosPermitidos = new Set([...servicios, "Productos", "Otra consulta"]);
    const barberosPermitidos = new Set([
        "Cualquiera disponible", "Barbero Uno", "Barbero Dos", "Barbero Tres"
    ]);
    const controlesNoPermitidos = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/;

    function obtenerHoy() {
        // Fecha local del dispositivo, evitando conversiones a UTC.
        const hoy = new Date();
        const anio = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, "0");
        const dia = String(hoy.getDate()).padStart(2, "0");

        return `${anio}-${mes}-${dia}`;
    }

    function actualizarCampos() {
        const esServicio = servicios.includes(consulta.value);

        datosCita.hidden = !esServicio;
        datosCita.disabled = !esServicio;
    }

    function limpiarResultado() {
        vistaMensaje.textContent = "";
        resultado.hidden = true;
        enlaceWhatsApp.hidden = true;
        enlaceWhatsApp.removeAttribute("href");
        estado.textContent = "";
    }

    // Leer la selección que viene de las otras páginas.
    const parametros = new URLSearchParams(window.location.search);

    // Solo aceptamos las opciones conocidas de nuestro catálogo.

    const barberosPorCodigo = new Map([
        ["uno", "Barbero Uno"],
        ["dos", "Barbero Dos"],
        ["tres", "Barbero Tres"]
    ]);

    const productosPorCodigo = new Map([
        ["cera", "Cera para cabello"],
        ["aceite", "Aceite para barba"],
        ["shampoo", "Shampoo"]
    ]);

    const servicioElegido = serviciosPorCodigo.get(
        parametros.get("servicio")
    );

    const barberoElegido = barberosPorCodigo.get(
        parametros.get("barbero")
    );

    const productoElegido = productosPorCodigo.get(
        parametros.get("producto")
    );

    if (servicioElegido) {
        consulta.value = servicioElegido;
    }

    if (barberoElegido) {
        document.querySelector("#barbero").value = barberoElegido;
    }

    if (productoElegido) {
        consulta.value = "Productos";

        document.querySelector("#comentario").value =
            `Me interesa el producto: ${productoElegido}.`;
    }

    fecha.min = obtenerHoy();
    actualizarCampos();

    consulta.addEventListener("change", actualizarCampos);

    // Si se editan los datos, hay que preparar el mensaje nuevamente.
    formulario.addEventListener("input", limpiarResultado);
    formulario.addEventListener("change", limpiarResultado);

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();
        limpiarResultado();

        fecha.min = obtenerHoy();

        if (!formulario.reportValidity()) {
            return;
        }

        const datos = new FormData(formulario);
        const nombre = String(datos.get("nombre") || "").trim();
        const motivo = String(datos.get("consulta") || "");
        const comentario = String(datos.get("comentario") || "").trim();

        if (!nombre) {
            estado.textContent = "Escribe tu nombre para continuar.";
            document.querySelector("#nombre").focus();
            return;
        }

        if (nombre.length > 60 || comentario.length > 500 ||
            controlesNoPermitidos.test(nombre + comentario) || /[\r\n]/.test(nombre)) {
            estado.textContent = "Revisa el nombre (máximo 60 caracteres) y el comentario (máximo 500), sin caracteres de control.";
            return;
        }

        if (!motivosPermitidos.has(motivo)) {
            estado.textContent = "Selecciona una consulta del listado.";
            return;
        }

        const lineas = [
            "Hola, Barbería Tarazona Style.",
            `Soy ${nombre}.`,
            `Me interesa: ${motivo}.`
        ];

        if (servicios.includes(motivo)) {
            const barbero = String(datos.get("barbero") || "");
            const fechaElegida = String(datos.get("fecha") || "");
            const horaElegida = String(datos.get("hora") || "");

            if (!barberosPermitidos.has(barbero)) {
                estado.textContent = "Selecciona un barbero del listado.";
                return;
            }

            // Comprobación adicional: el navegador también valida date/time.
            if (fechaElegida && (!/^\d{4}-\d{2}-\d{2}$/.test(fechaElegida) ||
                    fechaElegida < obtenerHoy())) {
                estado.textContent = "Elige una fecha válida que no esté en el pasado.";
                return;
            }
            if (horaElegida && !/^([01]\d|2[0-3]):[0-5]\d$/.test(horaElegida)) {
                estado.textContent = "Elige una hora válida.";
                return;
            }

            lineas.push(`Barbero: ${barbero}.`);

            if (fechaElegida) {
                const [anio, mes, dia] = fechaElegida.split("-");
                lineas.push(`Fecha preferida: ${dia}/${mes}/${anio}.`);
            }

            if (horaElegida) {
                lineas.push(`Hora preferida: ${horaElegida}.`);
            }

            lineas.push(
                "¿Podrían confirmarme disponibilidad, precio y adelanto?"
            );
        } else if (motivo === "Productos") {
            lineas.push(
                "Quisiera conocer el precio, la disponibilidad y la forma de entrega."
            );
        }

        if (comentario) {
            lineas.push(`Comentario: ${comentario}`);
        }

        const mensaje = lineas.join("\n");

        // Mostrar como texto, sin interpretar HTML ingresado.
        vistaMensaje.textContent = mensaje;
        resultado.hidden = false;

        // Comprobación básica del formato internacional.
        // No verifica que el número tenga una cuenta de WhatsApp.
        const numeroValido = /^[1-9]\d{7,14}$/.test(NUMERO_WHATSAPP);

        if (!numeroValido) {
            estado.textContent =
                "Vista previa lista. Falta configurar el número de WhatsApp del negocio.";
            return;
        }

        enlaceWhatsApp.href =
            `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;

        enlaceWhatsApp.hidden = false;
        estado.textContent =
            "Mensaje listo. Revísalo y pulsa Abrir WhatsApp para continuar.";
    });
    // Habilitar solo después de registrar el manejador que impide el envío nativo.
    document.querySelector("#preparar-mensaje").disabled = false;
    window.addEventListener("pageshow", limpiarResultado);
}