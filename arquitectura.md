DOCUMENTO DE ESPECIFICACIÓN FUNCIONAL Y ARQUITECTURA: APP DE MINISTROS
1. Matriz de Roles y Permisos (RBAC)
El sistema opera bajo un modelo jerárquico para garantizar el orden del cronograma y la integridad del catálogo musical.
Rol
Gestión de Usuarios
Catálogo de Canciones
Gestión de Listas
Asignación de Turnos
Administrador
CRUD Completo
CRUD Completo (Aprueba/Rechaza sugerencias)
CRUD Completo siempre
Control total
Líder
Ninguno
Leer + Enviar sugerencias
CRUD Completo solo en su turno
Control total
Ministro
Ninguno
Leer + Enviar sugerencias
CRUD Completo solo en su turno
Ninguno

2. Arquitectura de Base de Datos y Entidades
El sistema se compone de cinco entidades principales interconectadas.
2.1. Tabla Cronograma (Gestión de Turnos)
Controla quién toca y cuándo. Al asignar un turno, el sistema otorga los permisos temporales.
id_turno (PK)
id_usuario (FK - Ministro asignado)
fecha_servicio (Date - Ej: Domingo 14 de Junio)
estado_turno (Enum: PENDIENTE, COMPLETADO, AUSENTE)
2.2. Tabla Cabecera: Playlists
Almacena la metadata de las listas. No contiene canciones directamente.
id_playlist (PK)
id_usuario (FK - Creador)
nombre (Varchar)
tipo (Enum: PRESET, EVENTO) -> Diferencia si es plantilla o evento real.
estado (Enum: PREPARACION, ENSAYO, DEFINITIVA, MAZO) -> Solo aplica si es EVENTO.
fecha_programada (DateTime) -> Obligatorio para EVENTOS, nulo para PRESETS.
2.3. Tabla Detalle (Pivot): lista_canciones
Conecta la Playlist con las canciones y guarda las configuraciones individuales de cada tema.
id_playlist (FK)
id_cancion (FK)
orden (Integer) -> Secuencia de ejecución (1, 2, 3...).
nota (Varchar) -> Tonalidad específica elegida por el ministro para ese tema exacto en ese servicio.
Índice compuesto: (id_playlist, orden) para lecturas rápidas.
2.4. Tabla Global: Canciones (El Catálogo)
Almacena la información inmutable de los temas.
id_cancion (PK)
nombre (Varchar)
artista (Varchar)
bpm (Integer) -> Ej: 72.
metrica (Varchar) -> Ej: 4/4, 6/8.
estado_aprobacion (Enum: APROBADA, PENDIENTE, RECHAZADA)
motivo_rechazo (Texto) -> Feedback del Admin si la canción es rechazada.
letra (Texto)
charts (Texto Formateado) -> Se almacenará en formato estructurado (ej. ChordPro) o texto plano preformateado para poder renderizar las secciones (INTRO, VERSE 1, CHORUS, BRIDGE) con los acordes exactamente encima de la letra, replicando la estructura estándar de la industria.
3. Visualización de Charts y Acordes
Para cumplir con el estándar visual requerido (estilo Elevation Worship / PDF referencial):
El frontend consumirá la columna charts y renderizará la canción respetando los saltos de línea y el espaciado monoespaciado.
La vista mostrará etiquetas claras para las dinámicas (ej: VERSE 1, CHORUS 1 (2x)).
Los acordes aparecerán alineados perfectamente sobre la sílaba correspondiente de la letra (ej: el acorde D sobre la frase "Grace upon grace").
4. Ciclo de Vida de las Listas
A. Plantillas (tipo: PRESET)
Plantillas privadas creadas libremente por el Ministro. No tienen fecha ni estado activo. Son 100% mutables por su creador en cualquier momento y sirven como base rápida para futuros eventos.
B. Eventos Activos (tipo: EVENTO)
Listas atadas al cronograma. Atraviesan 4 fases:
PREPARACION: El Ministro tiene control total sobre lista_canciones (agregar, quitar, ordenar y cambiar notas).
ENSAYO: Estado intermedio que congela la estructura mayor para la práctica.
DEFINITIVA: Lista cerrada para la ejecución del servicio.
MAZO (Archivo Terminal): A las 24 horas de ser Definitiva, el sistema la actualiza a MAZO. Se vuelve pública, inmutable y de solo lectura en el perfil del Ministro, sirviendo como historial histórico.
5. Motor de Reutilización (Deep Copy)
La regla de oro del sistema es: El historial no se altera ni desaparece. Un MAZO nunca vuelve atrás.
Reutilización Propia: Si un Ministro quiere volver a tocar un MAZO propio, el sistema clona la cabecera y el detalle (lista_canciones), creando un nuevo evento en PREPARACION. El MAZO original sigue intacto en su perfil.
Clonación Social: Si el Ministro "A" copia un MAZO del Ministro "B", el sistema genera un duplicado exacto en la cuenta de "A" configurado como PRESET (plantilla), listo para ser usado o modificado sin afectar a "B".
6. Flujo de Sugerencias de Canciones
Envío: El Ministro llena el formulario con metadatos, letra y charts. Ingresa con estado PENDIENTE. No se indexa en búsquedas ni se puede agregar a listas.
Revisión Admin:
Aprobada: Se hace pública globalmente.
Rechazada: Queda oculta. El Admin rellena la columna motivo_rechazo. El Ministro recibe una alerta, lee el feedback, corrige la misma solicitud y la vuelve a enviar.



