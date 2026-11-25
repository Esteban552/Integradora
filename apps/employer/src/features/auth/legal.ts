import type { LegalDocument } from '@trabajos/services';

/**
 * Versión de los documentos legales que se registra en terms_acceptances.
 * Textos entregados por Lluvia (documentación), versión 1.0 del 24/11/2026.
 */
export const LEGAL_VERSION = '1.0';

export const LEGAL_TITLES: Record<LegalDocument, string> = {
  terms: 'Términos de Uso',
  privacy: 'Aviso de Privacidad',
};

/**
 * TODO(Eber): el nombre oficial del proyecto sigue pendiente. Los textos conservan el marcador
 * [NOMBRE DEL PROYECTO]; al confirmarlo, cambiar aquí y se reemplaza en ambos documentos.
 */
export const PROJECT_NAME_PLACEHOLDER = '[NOMBRE DEL PROYECTO]';
export const PROJECT_NAME: string = PROJECT_NAME_PLACEHOLDER;

const withProjectName = (text: string): string => text.split(PROJECT_NAME_PLACEHOLDER).join(PROJECT_NAME);

const TERMS_TEXT = `TÉRMINOS DE USO

Versión: 1.0 | Fecha de última actualización: 24 de noviembre de 2026

1. Aceptación y naturaleza del servicio

Al registrarte y marcar la casilla de aceptación en nuestras aplicaciones móviles (App del Empleador o App del Trabajador), aceptas estos Términos de Uso. [NOMBRE DEL PROYECTO] es una plataforma desarrollada como proyecto académico en la Universidad Tecnológica de San Luis Río Colorado (UTSLRC) que facilita la conexión entre personas que requieren servicios de corta duración (Empleadores) y personas interesadas en realizarlos (Trabajadores).

La plataforma actúa exclusivamente como intermediaria tecnológica. No prestamos los servicios publicados, no somos empleadores de los Trabajadores ni formamos parte de los acuerdos laborales o civiles que se establezcan entre las partes.

2. Requisitos de registro y cuentas

Para crear una cuenta debes tener al menos 18 años cumplidos, lo cual declaras bajo protesta de decir verdad al ingresar tu fecha de nacimiento. Cada usuario puede registrar un único rol por cuenta (Empleador o Trabajador) utilizando un correo electrónico válido, contraseña segura y número de teléfono.

Eres responsable de mantener la confidencialidad de tu contraseña y de toda actividad realizada desde tu cuenta. El uso de datos falsos o la suplantación de identidad provocará la suspensión o bloqueo permanente de la cuenta.

3. Reglas para Empleadores

Como Empleador, te comprometes a publicar oportunidades de trabajo reales, lícitas y con condiciones claras, incluyendo título, descripción, categoría, fecha, horario, pago fijo en pesos mexicanos (MXN) y ubicación exacta en el mapa.

Puedes editar o cancelar una publicación libremente antes de seleccionar a un Trabajador. Una vez seleccionado, la cancelación directa queda restringida y cualquier incidencia o ausencia deberá gestionarse mediante el Centro de Casos y Soporte dentro de la aplicación.

4. Reglas para Trabajadores

Como Trabajador, puedes configurar una ubicación de referencia manual y un radio de búsqueda en kilómetros para postularte a los trabajos disponibles. Solo puedes enviar una postulación por cada publicación.

Si eres seleccionado, cuentas con un plazo de 24 horas para confirmar las condiciones del servicio y completar el alta de tu cuenta conectada en Stripe Connect. Asimismo, te comprometes a registrar tu llegada dentro de la ventana permitida y a solicitar la finalización del trabajo mediante el código de seis dígitos o las evidencias correspondientes.

5. Pagos, comisiones y procesamiento con Stripe

Todos los pagos se gestionan en pesos mexicanos (MXN) a través de Stripe Connect en entorno de pruebas para fines de demostración académica. No se procesa dinero real.

Sobre el monto fijo del trabajo acordado, la plataforma aplica una comisión de servicio del 10% (redondeada al centavo más cercano), la cual se suma al total que cubre el Empleador antes de iniciar el servicio. Los fondos quedan retenidos de forma segura hasta que el trabajo se marque como finalizado o se resuelva una reclamación.

6. Cancelaciones, reclamaciones y moderación

En caso de incumplimiento, ausencia o desacuerdo sobre un trabajo con pago confirmado, cualquiera de las partes puede abrir una reclamación antes de que los fondos sean transferidos. El equipo administrador revisará las evidencias y determinará si procede la transferencia total, una liquidación parcial o el reembolso al Empleador.

Está prohibido publicar contenido ofensivo, ilegal o engañoso en publicaciones, perfiles, mensajes de chat o reseñas. Los administradores pueden ocultar o retirar contenido y aplicar advertencias, suspensiones temporales o bloqueos definitivos a las cuentas que infrinjan estas normas.

7. Limitación de responsabilidad y contacto

Al tratarse de un sistema desarrollado con fines escolares y de demostración, [NOMBRE DEL PROYECTO] se ofrece tal cual, sin garantías comerciales ni responsabilidades por daños directos o indirectos derivados de los trabajos acordados entre usuarios. Para cualquier duda, aclaración o reclamo sobre el servicio, puedes levantar un ticket desde el Centro de Casos y Soporte dentro de la aplicación.

Nos reservamos el derecho de actualizar estos Términos de Uso. Cuando exista una nueva versión, el sistema solicitará tu aceptación expresa antes de continuar utilizando las funciones de tu cuenta.`;

const PRIVACY_TEXT = `AVISO DE PRIVACIDAD

Versión: 1.0 | Fecha de última actualización: 24 de noviembre de 2026

1. Identidad y domicilio del responsable

La Universidad Tecnológica de San Luis Río Colorado (UTSLRC), a través del equipo desarrollador del proyecto académico [NOMBRE DEL PROYECTO], con domicilio en Av. Jalisco y Calle 59 s/n, Col. Progreso, C.P. 83458, San Luis Río Colorado, Sonora, es responsable del tratamiento y protección de los datos personales recabados a través de nuestras aplicaciones móviles.

2. Datos personales que recabamos

Para el funcionamiento de la plataforma, recopilamos los siguientes datos proporcionados directamente por ti durante el registro y uso de la app: nombre o razón comercial, correo electrónico, número de teléfono, fecha de nacimiento (para verificar la mayoría de edad), fotografía de perfil opcional, habilidades, disponibilidad, mensajes de chat, reseñas y fotografías o documentos de evidencia.

En relación con los pagos, Stripe Connect recopila y gestiona directamente los datos bancarios o de identidad necesarios para las cuentas conectadas; nuestra plataforma únicamente almacena el identificador técnico de cuenta y el estado de las transacciones, sin guardar números de tarjeta ni cuentas bancarias.

3. Datos de ubicación y privacidad antes de la selección

Nuestras aplicaciones no solicitan permisos de rastreo GPS en tiempo real. El Trabajador marca manualmente un punto de referencia en el mapa, y el Empleador marca el punto exacto donde se realizará el trabajo.

Para proteger tu seguridad, antes de que un Empleador seleccione a un Trabajador, la plataforma únicamente muestra la colonia o localidad del trabajo y un rango aproximado de distancia. El domicilio exacto, el pin en el mapa y el número de teléfono de ambas partes se mantienen ocultos y se comparten exclusivamente entre Empleador y Trabajador una vez confirmada la selección.

4. Finalidades del tratamiento de datos

Utilizamos tus datos personales para: crear y administrar tu cuenta según tu rol; conectar ofertas de trabajo con trabajadores cercanos; habilitar el chat en tiempo real asociado a cada servicio; procesar pagos, comisiones y reembolsos de prueba mediante Stripe; gestionar tickets, reportes o reclamaciones; y enviar notificaciones push sobre el estado de tus servicios.

Asimismo, registramos la fecha, hora y versión de los documentos legales que aceptas para mantener un historial de cumplimiento dentro del sistema.

5. Transferencia y almacenamiento de datos

Tus datos se almacenan de forma segura en infraestructura en la nube (Supabase) con controles de acceso por rol y cifrado en tránsito. Solo compartimos información indispensable con proveedores tecnológicos que hacen posible el servicio, específicamente Stripe (para el procesamiento de pagos de prueba) y el servicio de notificaciones push configurado para la aplicación.

No vendemos, alquilamos ni comercializamos tus datos personales con terceros.

6. Derechos de acceso, rectificación y cancelación

Puedes consultar y actualizar la información de tu perfil directamente desde la configuración de tu aplicación móvil. Para presentar dudas, reclamos o solicitudes relacionadas con tus datos personales (acceso, rectificación, cancelación u oposición), así como para solicitar la baja lógica de tu cuenta, deberás levantar un ticket desde el Centro de Casos y Soporte dentro de la aplicación.

En caso de baja lógica, tu perfil dejará de ser visible y se bloqueará el acceso, conservando únicamente bajo resguardo restringido los registros históricos de trabajos, pagos y casos necesarios para auditoría académica y resolución de incidencias.

7. Cambios al Aviso de Privacidad

Cualquier modificación a este Aviso de Privacidad será notificada dentro de las aplicaciones móviles mediante la publicación de una nueva versión identificada con su número y fecha, requiriendo tu aceptación previa para continuar operando en la plataforma`;

export const LEGAL_BODIES: Record<LegalDocument, string> = {
  terms: withProjectName(TERMS_TEXT),
  privacy: withProjectName(PRIVACY_TEXT),
};
