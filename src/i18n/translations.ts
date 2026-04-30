export type LanguageCode = 'en' | 'es' | 'ar' | 'zh';

export const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
  { code: 'zh', label: '中文' },
];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return value === 'en' || value === 'es' || value === 'ar' || value === 'zh';
}

type TranslationDict = Record<string, string>;

const en: TranslationDict = {
  // Tabs
  'tab.home': 'Home',
  'tab.leaderboard': 'Leaderboard',
  'tab.history': 'History',
  'tab.settings': 'Settings',

  // Navigation header titles
  'nav.activityDetail': 'Activity',
  'nav.activityRun': 'Run Activity',
  'nav.activityResult': 'Results',
  'nav.resultSummary': 'Save Result',
  'nav.teamSetup': 'Team Setup',

  // Welcome
  'welcome.title': 'Welcome to STEMM Lab',
  'welcome.subtitle': 'Real-world STEMM activities, gamified.',
  'welcome.cta': 'Get Started',

  // Team Setup
  'teamSetup.title': 'Team Setup',
  'teamSetup.subtitle': 'Tell us about your team before you start exploring activities.',
  'teamSetup.teamName': 'Team Name',
  'teamSetup.teamNamePlaceholder': 'e.g. The Lab Rats',
  'teamSetup.members': 'Members',
  'teamSetup.memberPlaceholder': 'Member {{n}}',
  'teamSetup.removeMember': 'Remove',
  'teamSetup.addMember': '+ Add Member',
  'teamSetup.grade': 'Grade / Year Level',
  'teamSetup.gradePlaceholder': 'e.g. Grade 9',
  'teamSetup.save': 'Save & Continue',
  'teamSetup.saving': 'Saving...',
  'teamSetup.alert.missingTitle': 'Missing info',
  'teamSetup.alert.missingName': 'Please enter a team name.',
  'teamSetup.alert.missingMembers': 'Please add at least one member.',
  'teamSetup.alert.missingGrade': 'Please enter a grade or year level.',
  'teamSetup.alert.errorTitle': 'Error',
  'teamSetup.alert.errorMessage': 'Could not save team. Please try again.',

  // Home (activity catalogue)
  'home.heading': 'Activities',
  'home.subheading': 'Pick a STEMM challenge to start.',
  'home.comingSoon': 'Coming Soon',

  // Activity categories (display labels)
  'category.Engineering': 'Engineering',
  'category.Health': 'Health',

  // Activity titles, domains, short descriptions, short labels (keyed by id)
  'activity.parachute.title': 'Parachute Drop Challenge',
  'activity.parachute.domain': 'Engineering + Physics',
  'activity.parachute.shortDescription':
    'Design and test a parachute to minimise landing speed and impact force.',
  'activity.parachute.shortLabel': 'Parachute',

  'activity.sound.title': 'Sound Pollution Hunter',
  'activity.sound.domain': 'Environmental Science',
  'activity.sound.shortDescription':
    'Measure and compare sound levels across different actions and places.',
  'activity.sound.shortLabel': 'Sound',

  'activity.handfan.title': 'Hand Fan Challenge',
  'activity.handfan.domain': 'Physics – Air Movement',
  'activity.handfan.shortDescription':
    'Fan air at targets from set distances and record the bend angle.',
  'activity.handfan.shortLabel': 'Hand Fan',

  'activity.earthquake.title': 'Earthquake-Resistant Structure',
  'activity.earthquake.domain': 'Engineering + Earth Science',
  'activity.earthquake.shortDescription':
    'Build a vibration-absorbing platform; measure phone movement during a simulated quake.',
  'activity.earthquake.shortLabel': 'Earthquake',

  'activity.performance.title': 'Human Performance Lab',
  'activity.performance.domain': 'Medical Science + Biomechanics',
  'activity.performance.shortDescription':
    'Use accelerometer to measure smoothness during slow vs. fast movements.',
  'activity.performance.shortLabel': 'Performance',

  'activity.reaction.title': 'Reaction Board Challenge',
  'activity.reaction.domain': 'Neuroscience + Mathematics',
  'activity.reaction.shortDescription':
    'Test reaction time, coordination, and improvement across three phases.',
  'activity.reaction.shortLabel': 'Reaction',

  'activity.breathing.title': 'Breathing Pace Trainer',
  'activity.breathing.domain': 'Medical Science',
  'activity.breathing.shortDescription':
    'Use the accelerometer to measure breathing rate at rest and after exercise.',
  'activity.breathing.shortLabel': 'Breathing',

  // Activity Detail
  'activityDetail.startBtn': 'Start Activity',
  'activityDetail.notice': 'This activity will be added in a later phase.',
  'activityDetail.notFound': 'Activity not found',
  'activityRun.notPlayable': 'This activity is not playable yet.',
  'activityResult.none': 'No results to show for this activity.',

  // Run – Sound
  'run.sound.heading': 'Sound Pollution Hunter',
  'run.sound.subheading':
    'Type what you are measuring, then record a few seconds of sound.',
  'run.sound.action': 'Action',
  'run.sound.actionPlaceholder': 'e.g. Lunch bell',
  'run.sound.level': 'Sound level',
  'run.sound.record': 'Record',
  'run.sound.stop': 'Stop',
  'run.sound.addEntry': 'Add Entry',
  'run.sound.entriesHeading': 'Entries this session ({{count}})',
  'run.sound.empty': 'No entries yet.',
  'run.sound.finish': 'Finish Activity',
  'run.sound.hint.listening': 'Listening… tap Stop when done.',
  'run.sound.hint.captured': 'Captured. Add the entry or measure again.',
  'run.sound.hint.denied': 'Microphone permission denied.',
  'run.sound.hint.tapRecord': 'Tap Record to start measuring.',
  'run.sound.alert.permissionTitle': 'Microphone permission denied',
  'run.sound.alert.permissionMessage':
    'You need to allow microphone access to measure sound levels.',
  'run.sound.alert.noPermissionTitle': 'No permission',
  'run.sound.alert.noPermissionMessage': 'Microphone permission is required.',
  'run.sound.alert.startFailTitle': 'Could not start recording',
  'run.sound.alert.startFailMessage': 'Please try again.',
  'run.sound.alert.stopFailTitle': 'Could not stop recording',
  'run.sound.alert.stopFailMessage': 'Please try again.',
  'run.sound.alert.missingActionTitle': 'Missing action',
  'run.sound.alert.missingActionMessage': 'Please enter what you were measuring.',
  'run.sound.alert.noMeasurementTitle': 'No measurement',
  'run.sound.alert.noMeasurementMessage':
    'Record a sound level before adding the entry.',
  'run.sound.alert.noEntriesTitle': 'No entries',
  'run.sound.alert.noEntriesMessage': 'Add at least one entry before finishing.',

  // Run – Reaction
  'run.reaction.heading': 'Reaction Board – Tap Phase',
  'run.reaction.subheading':
    'Tap Start, wait for the green signal, then tap as fast as you can.',
  'run.reaction.area.idle': 'Press Start to begin',
  'run.reaction.area.waiting': 'Wait for green…',
  'run.reaction.area.go': 'TAP NOW!',
  'run.reaction.area.tooSoon': 'Too soon! Try again.',
  'run.reaction.area.resultSub': 'Nice tap!',
  'run.reaction.start': 'Start',
  'run.reaction.tryAgain': 'Try Again',
  'run.reaction.cancel': 'Cancel',
  'run.reaction.stat.attempts': 'Attempts',
  'run.reaction.stat.best': 'Best',
  'run.reaction.stat.average': 'Average',
  'run.reaction.attemptsHeading': 'Attempts this session ({{count}})',
  'run.reaction.empty': 'No attempts yet.',
  'run.reaction.attemptLabel': 'Attempt {{n}}',
  'run.reaction.finish': 'Finish Activity',
  'run.reaction.alert.noAttemptsTitle': 'No attempts',
  'run.reaction.alert.noAttemptsMessage': 'Try at least one tap before finishing.',

  // Run – Earthquake
  'run.earthquake.heading': 'Earthquake-Resistant Structure',
  'run.earthquake.subheading':
    'Place the phone on your structure, pick a mode, then tap Start Test. Tap Stop to record the result.',
  'run.earthquake.mode.manual': 'Manual',
  'run.earthquake.mode.simulate': 'Simulate Earthquake',
  'run.earthquake.meter.live': 'Live shake',
  'run.earthquake.meter.lastPeak': 'Last peak',
  'run.earthquake.hint.simulating': 'Phone is vibrating… tap Stop when the test is complete.',
  'run.earthquake.hint.shaking': 'Shaking… tap Stop when the test is complete.',
  'run.earthquake.hint.complete': 'Test complete. Add another attempt or finish.',
  'run.earthquake.hint.unavailable': 'Accelerometer not available on this device.',
  'run.earthquake.hint.simulatePrompt':
    'Place phone on the structure, then tap Start Test to vibrate.',
  'run.earthquake.hint.manualPrompt':
    'Place phone on the structure, then tap Start Test and shake.',
  'run.earthquake.stat.time': 'Time',
  'run.earthquake.stat.peak': 'Peak',
  'run.earthquake.stat.average': 'Average',
  'run.earthquake.start': 'Start Test',
  'run.earthquake.stop': 'Stop Test',
  'run.earthquake.attemptsHeading': 'Attempts this session ({{count}})',
  'run.earthquake.empty': 'No attempts yet.',
  'run.earthquake.attemptLabel': 'Attempt {{n}}',
  'run.earthquake.entryPeak': 'Peak {{value}} g',
  'run.earthquake.entrySub': '{{seconds}} s · avg {{avg}} g',
  'run.earthquake.finish': 'Finish Activity',
  'run.earthquake.alert.unavailableTitle': 'Accelerometer unavailable',
  'run.earthquake.alert.unavailableMessage':
    'This device does not provide accelerometer data.',
  'run.earthquake.alert.noDataTitle': 'No data',
  'run.earthquake.alert.noDataMessage': 'No accelerometer samples were captured.',
  'run.earthquake.alert.noAttemptsTitle': 'No attempts',
  'run.earthquake.alert.noAttemptsMessage': 'Run at least one test before finishing.',

  // Result screens (per-activity history view)
  'result.common.latest': 'Latest Attempt',
  'result.common.savedAt': 'Saved {{when}}',
  'result.common.totalAttempts': 'Total attempts saved: {{count}}',
  'result.common.empty': 'No attempts saved yet.',
  'result.common.back': 'Back to Activities',

  'result.sound.entries': 'Entries',
  'result.sound.loudest': 'Loudest',
  'result.sound.quietest': 'Quietest',
  'result.sound.average': 'Average',
  'result.sound.listHeading': 'Recorded sound levels',

  'result.reaction.taps': 'Taps',
  'result.reaction.best': 'Best',
  'result.reaction.slowest': 'Slowest',
  'result.reaction.average': 'Average',
  'result.reaction.listHeading': 'Reaction times',
  'result.reaction.attemptLabel': 'Attempt {{n}}',

  'result.earthquake.tests': 'Tests',
  'result.earthquake.bestPeak': 'Best (lowest peak)',
  'result.earthquake.worstPeak': 'Worst (highest peak)',
  'result.earthquake.meanPeak': 'Mean peak',
  'result.earthquake.meanShake': 'Mean shake',
  'result.earthquake.listHeading': 'Test runs',
  'result.earthquake.attemptLabel': 'Attempt {{n}}',
  'result.earthquake.entryPeak': 'Peak {{value}} g',
  'result.earthquake.entrySub': '{{seconds}} s · avg {{avg}} g',

  // Result Summary (save flow)
  'summary.heading': 'Activity complete',
  'summary.resultLabel': 'Result',
  'summary.teamMeta': 'Team: {{name}} · {{count}} {{member}}',
  'summary.rate': 'Rate this experiment',
  'summary.reflection': 'Reflection (optional)',
  'summary.reflectionPlaceholder': 'What did you notice? What would you change?',
  'summary.save': 'Save Result',
  'summary.saving': 'Saving…',
  'summary.alert.noTeamTitle': 'No team',
  'summary.alert.noTeamMessage': 'Set up a team before saving results.',
  'summary.alert.saveFailTitle': 'Save failed',
  'summary.alert.saveFailMessage': 'Could not save your result. Please try again.',

  // History
  'history.heading': 'History',
  'history.subheading': 'All saved attempts across activities.',
  'history.filter.all': 'All',
  'history.empty.noResultsTitle': 'No results yet',
  'history.empty.noResultsMessage': 'Finish an activity to see your history grow.',
  'history.empty.noFilteredTitle': 'No attempts here',
  'history.empty.noFilteredMessage': 'No saved attempts for this activity yet.',
  'history.error.title': "Couldn't load history",
  'history.error.message': 'Something went wrong reading saved results. Try again later.',

  // Leaderboard
  'leaderboard.heading': 'Leaderboard',
  'leaderboard.lowerBetter': 'Lower is better',
  'leaderboard.higherBetter': 'Higher is better',
  'leaderboard.stat.attempts': 'Attempts',
  'leaderboard.stat.best': 'Best',
  'leaderboard.stat.average': 'Average',
  'leaderboard.empty.title': 'No data available',
  'leaderboard.empty.message': 'Finish an activity to see ranked results here.',
  'leaderboard.error.title': "Couldn't load leaderboard",
  'leaderboard.error.message': 'Something went wrong reading saved results. Try again later.',

  // Settings
  'settings.heading': 'Settings',
  'settings.subheading': 'Theme, accessibility, and reset options.',
  'settings.section.display': 'Display',
  'settings.section.language': 'Language',
  'settings.section.team': 'Team',
  'settings.section.data': 'Data',
  'settings.darkMode': 'Dark mode',
  'settings.largeText': 'Large text',
  'settings.largeTextHint': 'Increases font sizes across the app for better readability.',
  'settings.resetTeam': 'Reset team',
  'settings.clearResults': 'Clear all results',
  'settings.team.current': 'Current team: {{name}} ({{count}} {{member}})',
  'settings.team.memberSingular': 'member',
  'settings.team.memberPlural': 'members',
  'settings.team.none': 'No team set up.',
  'settings.alert.resetTeam.title': 'Reset team?',
  'settings.alert.resetTeam.message':
    'This signs out the current team. Saved results will be kept.',
  'settings.alert.clearResults.title': 'Clear all results?',
  'settings.alert.clearResults.message':
    'This permanently deletes every saved attempt across activities. This cannot be undone.',
  'settings.alert.cleared.title': 'Done',
  'settings.alert.cleared.message': 'All saved results have been cleared.',
  'settings.alert.error': 'Error',
  'settings.alert.resetError': 'Could not reset team. Please try again.',
  'settings.alert.clearError': 'Could not clear results. Please try again.',

  'common.cancel': 'Cancel',
  'common.reset': 'Reset',
  'common.clear': 'Clear',
};

const es: TranslationDict = {
  'tab.home': 'Inicio',
  'tab.leaderboard': 'Clasificación',
  'tab.history': 'Historial',
  'tab.settings': 'Ajustes',

  'nav.activityDetail': 'Actividad',
  'nav.activityRun': 'Ejecutar Actividad',
  'nav.activityResult': 'Resultados',
  'nav.resultSummary': 'Guardar Resultado',
  'nav.teamSetup': 'Configuración del Equipo',

  'welcome.title': 'Bienvenido a STEMM Lab',
  'welcome.subtitle': 'Actividades STEMM del mundo real, gamificadas.',
  'welcome.cta': 'Comenzar',

  'teamSetup.title': 'Configuración del Equipo',
  'teamSetup.subtitle':
    'Cuéntanos sobre tu equipo antes de explorar las actividades.',
  'teamSetup.teamName': 'Nombre del Equipo',
  'teamSetup.teamNamePlaceholder': 'p. ej. Las Ratas de Lab',
  'teamSetup.members': 'Miembros',
  'teamSetup.memberPlaceholder': 'Miembro {{n}}',
  'teamSetup.removeMember': 'Eliminar',
  'teamSetup.addMember': '+ Añadir Miembro',
  'teamSetup.grade': 'Grado / Curso',
  'teamSetup.gradePlaceholder': 'p. ej. 9.º grado',
  'teamSetup.save': 'Guardar y Continuar',
  'teamSetup.saving': 'Guardando...',
  'teamSetup.alert.missingTitle': 'Falta información',
  'teamSetup.alert.missingName': 'Por favor escribe un nombre de equipo.',
  'teamSetup.alert.missingMembers': 'Por favor añade al menos un miembro.',
  'teamSetup.alert.missingGrade': 'Por favor escribe un grado o curso.',
  'teamSetup.alert.errorTitle': 'Error',
  'teamSetup.alert.errorMessage': 'No se pudo guardar el equipo. Inténtalo de nuevo.',

  'home.heading': 'Actividades',
  'home.subheading': 'Elige un reto STEMM para empezar.',
  'home.comingSoon': 'Próximamente',

  'category.Engineering': 'Ingeniería',
  'category.Health': 'Salud',

  'activity.parachute.title': 'Reto de Caída con Paracaídas',
  'activity.parachute.domain': 'Ingeniería + Física',
  'activity.parachute.shortDescription':
    'Diseña y prueba un paracaídas para minimizar la velocidad de aterrizaje y la fuerza de impacto.',
  'activity.parachute.shortLabel': 'Paracaídas',

  'activity.sound.title': 'Cazador de Contaminación Sonora',
  'activity.sound.domain': 'Ciencias Ambientales',
  'activity.sound.shortDescription':
    'Mide y compara los niveles de sonido en diferentes acciones y lugares.',
  'activity.sound.shortLabel': 'Sonido',

  'activity.handfan.title': 'Reto del Abanico de Mano',
  'activity.handfan.domain': 'Física – Movimiento del Aire',
  'activity.handfan.shortDescription':
    'Abanica aire hacia objetivos a distancias fijas y registra el ángulo de inclinación.',
  'activity.handfan.shortLabel': 'Abanico',

  'activity.earthquake.title': 'Estructura Antisísmica',
  'activity.earthquake.domain': 'Ingeniería + Ciencias de la Tierra',
  'activity.earthquake.shortDescription':
    'Construye una plataforma que absorba vibraciones; mide el movimiento del teléfono durante un sismo simulado.',
  'activity.earthquake.shortLabel': 'Sismo',

  'activity.performance.title': 'Laboratorio de Rendimiento Humano',
  'activity.performance.domain': 'Ciencia Médica + Biomecánica',
  'activity.performance.shortDescription':
    'Usa el acelerómetro para medir la suavidad durante movimientos lentos y rápidos.',
  'activity.performance.shortLabel': 'Rendimiento',

  'activity.reaction.title': 'Reto del Tablero de Reacción',
  'activity.reaction.domain': 'Neurociencia + Matemáticas',
  'activity.reaction.shortDescription':
    'Pon a prueba el tiempo de reacción, la coordinación y la mejora a lo largo de tres fases.',
  'activity.reaction.shortLabel': 'Reacción',

  'activity.breathing.title': 'Entrenador del Ritmo Respiratorio',
  'activity.breathing.domain': 'Ciencia Médica',
  'activity.breathing.shortDescription':
    'Usa el acelerómetro para medir el ritmo respiratorio en reposo y tras hacer ejercicio.',
  'activity.breathing.shortLabel': 'Respiración',

  'activityDetail.startBtn': 'Iniciar Actividad',
  'activityDetail.notice': 'Esta actividad se añadirá en una fase posterior.',
  'activityDetail.notFound': 'Actividad no encontrada',
  'activityRun.notPlayable': 'Esta actividad aún no se puede jugar.',
  'activityResult.none': 'No hay resultados que mostrar para esta actividad.',

  'run.sound.heading': 'Cazador de Contaminación Sonora',
  'run.sound.subheading':
    'Escribe lo que estás midiendo y graba unos segundos de sonido.',
  'run.sound.action': 'Acción',
  'run.sound.actionPlaceholder': 'p. ej. Timbre del almuerzo',
  'run.sound.level': 'Nivel de sonido',
  'run.sound.record': 'Grabar',
  'run.sound.stop': 'Detener',
  'run.sound.addEntry': 'Añadir Entrada',
  'run.sound.entriesHeading': 'Entradas en esta sesión ({{count}})',
  'run.sound.empty': 'Aún no hay entradas.',
  'run.sound.finish': 'Terminar Actividad',
  'run.sound.hint.listening': 'Escuchando… toca Detener cuando termines.',
  'run.sound.hint.captured': 'Capturado. Añade la entrada o vuelve a medir.',
  'run.sound.hint.denied': 'Permiso de micrófono denegado.',
  'run.sound.hint.tapRecord': 'Toca Grabar para empezar a medir.',
  'run.sound.alert.permissionTitle': 'Permiso de micrófono denegado',
  'run.sound.alert.permissionMessage':
    'Necesitas permitir el acceso al micrófono para medir los niveles de sonido.',
  'run.sound.alert.noPermissionTitle': 'Sin permiso',
  'run.sound.alert.noPermissionMessage': 'Se requiere permiso de micrófono.',
  'run.sound.alert.startFailTitle': 'No se pudo iniciar la grabación',
  'run.sound.alert.startFailMessage': 'Inténtalo de nuevo.',
  'run.sound.alert.stopFailTitle': 'No se pudo detener la grabación',
  'run.sound.alert.stopFailMessage': 'Inténtalo de nuevo.',
  'run.sound.alert.missingActionTitle': 'Falta acción',
  'run.sound.alert.missingActionMessage': 'Por favor escribe lo que estabas midiendo.',
  'run.sound.alert.noMeasurementTitle': 'Sin medición',
  'run.sound.alert.noMeasurementMessage':
    'Graba un nivel de sonido antes de añadir la entrada.',
  'run.sound.alert.noEntriesTitle': 'Sin entradas',
  'run.sound.alert.noEntriesMessage': 'Añade al menos una entrada antes de terminar.',

  'run.reaction.heading': 'Tablero de Reacción – Fase de Toques',
  'run.reaction.subheading':
    'Toca Iniciar, espera la señal verde y luego toca lo más rápido que puedas.',
  'run.reaction.area.idle': 'Pulsa Iniciar para empezar',
  'run.reaction.area.waiting': 'Espera el verde…',
  'run.reaction.area.go': '¡TOCA YA!',
  'run.reaction.area.tooSoon': '¡Demasiado pronto! Inténtalo de nuevo.',
  'run.reaction.area.resultSub': '¡Buen toque!',
  'run.reaction.start': 'Iniciar',
  'run.reaction.tryAgain': 'Reintentar',
  'run.reaction.cancel': 'Cancelar',
  'run.reaction.stat.attempts': 'Intentos',
  'run.reaction.stat.best': 'Mejor',
  'run.reaction.stat.average': 'Promedio',
  'run.reaction.attemptsHeading': 'Intentos en esta sesión ({{count}})',
  'run.reaction.empty': 'Aún no hay intentos.',
  'run.reaction.attemptLabel': 'Intento {{n}}',
  'run.reaction.finish': 'Terminar Actividad',
  'run.reaction.alert.noAttemptsTitle': 'Sin intentos',
  'run.reaction.alert.noAttemptsMessage':
    'Prueba al menos un toque antes de terminar.',

  'run.earthquake.heading': 'Estructura Antisísmica',
  'run.earthquake.subheading':
    'Coloca el teléfono en tu estructura, elige un modo y toca Iniciar Prueba. Toca Detener para registrar el resultado.',
  'run.earthquake.mode.manual': 'Manual',
  'run.earthquake.mode.simulate': 'Simular Sismo',
  'run.earthquake.meter.live': 'Vibración en vivo',
  'run.earthquake.meter.lastPeak': 'Último pico',
  'run.earthquake.hint.simulating':
    'El teléfono está vibrando… toca Detener cuando la prueba termine.',
  'run.earthquake.hint.shaking':
    'Agitando… toca Detener cuando la prueba termine.',
  'run.earthquake.hint.complete': 'Prueba completa. Añade otro intento o termina.',
  'run.earthquake.hint.unavailable': 'Acelerómetro no disponible en este dispositivo.',
  'run.earthquake.hint.simulatePrompt':
    'Coloca el teléfono en la estructura y toca Iniciar Prueba para vibrar.',
  'run.earthquake.hint.manualPrompt':
    'Coloca el teléfono en la estructura, toca Iniciar Prueba y agita.',
  'run.earthquake.stat.time': 'Tiempo',
  'run.earthquake.stat.peak': 'Pico',
  'run.earthquake.stat.average': 'Promedio',
  'run.earthquake.start': 'Iniciar Prueba',
  'run.earthquake.stop': 'Detener Prueba',
  'run.earthquake.attemptsHeading': 'Intentos en esta sesión ({{count}})',
  'run.earthquake.empty': 'Aún no hay intentos.',
  'run.earthquake.attemptLabel': 'Intento {{n}}',
  'run.earthquake.entryPeak': 'Pico {{value}} g',
  'run.earthquake.entrySub': '{{seconds}} s · prom {{avg}} g',
  'run.earthquake.finish': 'Terminar Actividad',
  'run.earthquake.alert.unavailableTitle': 'Acelerómetro no disponible',
  'run.earthquake.alert.unavailableMessage':
    'Este dispositivo no proporciona datos del acelerómetro.',
  'run.earthquake.alert.noDataTitle': 'Sin datos',
  'run.earthquake.alert.noDataMessage':
    'No se capturaron muestras del acelerómetro.',
  'run.earthquake.alert.noAttemptsTitle': 'Sin intentos',
  'run.earthquake.alert.noAttemptsMessage':
    'Realiza al menos una prueba antes de terminar.',

  'result.common.latest': 'Último Intento',
  'result.common.savedAt': 'Guardado {{when}}',
  'result.common.totalAttempts': 'Total de intentos guardados: {{count}}',
  'result.common.empty': 'Aún no se han guardado intentos.',
  'result.common.back': 'Volver a Actividades',

  'result.sound.entries': 'Entradas',
  'result.sound.loudest': 'Más fuerte',
  'result.sound.quietest': 'Más bajo',
  'result.sound.average': 'Promedio',
  'result.sound.listHeading': 'Niveles de sonido registrados',

  'result.reaction.taps': 'Toques',
  'result.reaction.best': 'Mejor',
  'result.reaction.slowest': 'Más lento',
  'result.reaction.average': 'Promedio',
  'result.reaction.listHeading': 'Tiempos de reacción',
  'result.reaction.attemptLabel': 'Intento {{n}}',

  'result.earthquake.tests': 'Pruebas',
  'result.earthquake.bestPeak': 'Mejor (pico más bajo)',
  'result.earthquake.worstPeak': 'Peor (pico más alto)',
  'result.earthquake.meanPeak': 'Pico medio',
  'result.earthquake.meanShake': 'Vibración media',
  'result.earthquake.listHeading': 'Pruebas realizadas',
  'result.earthquake.attemptLabel': 'Intento {{n}}',
  'result.earthquake.entryPeak': 'Pico {{value}} g',
  'result.earthquake.entrySub': '{{seconds}} s · prom {{avg}} g',

  'summary.heading': 'Actividad completada',
  'summary.resultLabel': 'Resultado',
  'summary.teamMeta': 'Equipo: {{name}} · {{count}} {{member}}',
  'summary.rate': 'Califica este experimento',
  'summary.reflection': 'Reflexión (opcional)',
  'summary.reflectionPlaceholder': '¿Qué notaste? ¿Qué cambiarías?',
  'summary.save': 'Guardar Resultado',
  'summary.saving': 'Guardando…',
  'summary.alert.noTeamTitle': 'Sin equipo',
  'summary.alert.noTeamMessage': 'Configura un equipo antes de guardar resultados.',
  'summary.alert.saveFailTitle': 'No se pudo guardar',
  'summary.alert.saveFailMessage':
    'No se pudo guardar tu resultado. Inténtalo de nuevo.',

  'history.heading': 'Historial',
  'history.subheading': 'Todos los intentos guardados en todas las actividades.',
  'history.filter.all': 'Todos',
  'history.empty.noResultsTitle': 'Aún no hay resultados',
  'history.empty.noResultsMessage':
    'Termina una actividad para ver crecer tu historial.',
  'history.empty.noFilteredTitle': 'No hay intentos aquí',
  'history.empty.noFilteredMessage':
    'Aún no hay intentos guardados para esta actividad.',
  'history.error.title': 'No se pudo cargar el historial',
  'history.error.message':
    'Algo salió mal al leer los resultados guardados. Inténtalo más tarde.',

  'leaderboard.heading': 'Clasificación',
  'leaderboard.lowerBetter': 'Más bajo es mejor',
  'leaderboard.higherBetter': 'Más alto es mejor',
  'leaderboard.stat.attempts': 'Intentos',
  'leaderboard.stat.best': 'Mejor',
  'leaderboard.stat.average': 'Promedio',
  'leaderboard.empty.title': 'No hay datos disponibles',
  'leaderboard.empty.message':
    'Termina una actividad para ver los resultados clasificados aquí.',
  'leaderboard.error.title': 'No se pudo cargar la clasificación',
  'leaderboard.error.message':
    'Algo salió mal al leer los resultados guardados. Inténtalo más tarde.',

  'settings.heading': 'Ajustes',
  'settings.subheading': 'Tema, accesibilidad y opciones de restablecimiento.',
  'settings.section.display': 'Pantalla',
  'settings.section.language': 'Idioma',
  'settings.section.team': 'Equipo',
  'settings.section.data': 'Datos',
  'settings.darkMode': 'Modo oscuro',
  'settings.largeText': 'Texto grande',
  'settings.largeTextHint':
    'Aumenta el tamaño del texto en toda la app para mejor legibilidad.',
  'settings.resetTeam': 'Restablecer equipo',
  'settings.clearResults': 'Borrar todos los resultados',
  'settings.team.current': 'Equipo actual: {{name}} ({{count}} {{member}})',
  'settings.team.memberSingular': 'miembro',
  'settings.team.memberPlural': 'miembros',
  'settings.team.none': 'No hay equipo configurado.',
  'settings.alert.resetTeam.title': '¿Restablecer equipo?',
  'settings.alert.resetTeam.message':
    'Esto desvincula al equipo actual. Los resultados guardados se conservarán.',
  'settings.alert.clearResults.title': '¿Borrar todos los resultados?',
  'settings.alert.clearResults.message':
    'Esto elimina permanentemente cada intento guardado en todas las actividades. No se puede deshacer.',
  'settings.alert.cleared.title': 'Listo',
  'settings.alert.cleared.message': 'Todos los resultados guardados se han borrado.',
  'settings.alert.error': 'Error',
  'settings.alert.resetError': 'No se pudo restablecer el equipo. Inténtalo de nuevo.',
  'settings.alert.clearError': 'No se pudieron borrar los resultados. Inténtalo de nuevo.',

  'common.cancel': 'Cancelar',
  'common.reset': 'Restablecer',
  'common.clear': 'Borrar',
};

const ar: TranslationDict = {
  'tab.home': 'الرئيسية',
  'tab.leaderboard': 'المتصدرون',
  'tab.history': 'السجل',
  'tab.settings': 'الإعدادات',

  'nav.activityDetail': 'النشاط',
  'nav.activityRun': 'تشغيل النشاط',
  'nav.activityResult': 'النتائج',
  'nav.resultSummary': 'حفظ النتيجة',
  'nav.teamSetup': 'إعداد الفريق',

  'welcome.title': 'مرحبًا بك في STEMM Lab',
  'welcome.subtitle': 'أنشطة STEMM واقعية ومُحوَّلة إلى ألعاب.',
  'welcome.cta': 'ابدأ الآن',

  'teamSetup.title': 'إعداد الفريق',
  'teamSetup.subtitle': 'أخبرنا عن فريقك قبل أن تبدأ في استكشاف الأنشطة.',
  'teamSetup.teamName': 'اسم الفريق',
  'teamSetup.teamNamePlaceholder': 'مثال: فئران المختبر',
  'teamSetup.members': 'الأعضاء',
  'teamSetup.memberPlaceholder': 'العضو {{n}}',
  'teamSetup.removeMember': 'إزالة',
  'teamSetup.addMember': '+ إضافة عضو',
  'teamSetup.grade': 'الصف / المستوى الدراسي',
  'teamSetup.gradePlaceholder': 'مثال: الصف 9',
  'teamSetup.save': 'حفظ ومتابعة',
  'teamSetup.saving': 'جارٍ الحفظ...',
  'teamSetup.alert.missingTitle': 'معلومات ناقصة',
  'teamSetup.alert.missingName': 'يرجى إدخال اسم الفريق.',
  'teamSetup.alert.missingMembers': 'يرجى إضافة عضو واحد على الأقل.',
  'teamSetup.alert.missingGrade': 'يرجى إدخال الصف أو المستوى الدراسي.',
  'teamSetup.alert.errorTitle': 'خطأ',
  'teamSetup.alert.errorMessage': 'تعذر حفظ الفريق. حاول مرة أخرى.',

  'home.heading': 'الأنشطة',
  'home.subheading': 'اختر تحدي STEMM للبدء.',
  'home.comingSoon': 'قريبًا',

  'category.Engineering': 'هندسة',
  'category.Health': 'صحة',

  'activity.parachute.title': 'تحدي إسقاط المظلة',
  'activity.parachute.domain': 'هندسة + فيزياء',
  'activity.parachute.shortDescription':
    'صمّم واختبر مظلة لتقليل سرعة الهبوط وقوة الاصطدام.',
  'activity.parachute.shortLabel': 'مظلة',

  'activity.sound.title': 'صياد التلوث الضوضائي',
  'activity.sound.domain': 'العلوم البيئية',
  'activity.sound.shortDescription':
    'قِس وقارن مستويات الصوت عبر إجراءات وأماكن مختلفة.',
  'activity.sound.shortLabel': 'الصوت',

  'activity.handfan.title': 'تحدي المروحة اليدوية',
  'activity.handfan.domain': 'فيزياء – حركة الهواء',
  'activity.handfan.shortDescription':
    'حرّك الهواء نحو أهداف من مسافات محددة وسجّل زاوية الانحناء.',
  'activity.handfan.shortLabel': 'مروحة',

  'activity.earthquake.title': 'هيكل مقاوم للزلازل',
  'activity.earthquake.domain': 'هندسة + علوم الأرض',
  'activity.earthquake.shortDescription':
    'ابنِ منصة تمتص الاهتزاز؛ وقِس حركة الهاتف خلال زلزال محاكى.',
  'activity.earthquake.shortLabel': 'زلزال',

  'activity.performance.title': 'مختبر الأداء البشري',
  'activity.performance.domain': 'العلوم الطبية + الميكانيكا الحيوية',
  'activity.performance.shortDescription':
    'استخدم مقياس التسارع لقياس سلاسة الحركات البطيئة مقابل السريعة.',
  'activity.performance.shortLabel': 'الأداء',

  'activity.reaction.title': 'تحدي لوحة ردود الفعل',
  'activity.reaction.domain': 'علم الأعصاب + الرياضيات',
  'activity.reaction.shortDescription':
    'اختبر زمن ردة الفعل والتنسيق والتحسن عبر ثلاث مراحل.',
  'activity.reaction.shortLabel': 'ردة فعل',

  'activity.breathing.title': 'مدرب وتيرة التنفس',
  'activity.breathing.domain': 'العلوم الطبية',
  'activity.breathing.shortDescription':
    'استخدم مقياس التسارع لقياس معدل التنفس أثناء الراحة وبعد التمرين.',
  'activity.breathing.shortLabel': 'تنفس',

  'activityDetail.startBtn': 'ابدأ النشاط',
  'activityDetail.notice': 'سيتم إضافة هذا النشاط في مرحلة لاحقة.',
  'activityDetail.notFound': 'لم يتم العثور على النشاط',
  'activityRun.notPlayable': 'هذا النشاط غير قابل للتشغيل بعد.',
  'activityResult.none': 'لا توجد نتائج لعرضها لهذا النشاط.',

  'run.sound.heading': 'صياد التلوث الضوضائي',
  'run.sound.subheading': 'اكتب ما تقيسه ثم سجّل بضع ثوانٍ من الصوت.',
  'run.sound.action': 'الإجراء',
  'run.sound.actionPlaceholder': 'مثال: جرس الغداء',
  'run.sound.level': 'مستوى الصوت',
  'run.sound.record': 'تسجيل',
  'run.sound.stop': 'إيقاف',
  'run.sound.addEntry': 'إضافة إدخال',
  'run.sound.entriesHeading': 'الإدخالات في هذه الجلسة ({{count}})',
  'run.sound.empty': 'لا توجد إدخالات بعد.',
  'run.sound.finish': 'إنهاء النشاط',
  'run.sound.hint.listening': 'يستمع… اضغط إيقاف عند الانتهاء.',
  'run.sound.hint.captured': 'تم التقاط القياس. أضف الإدخال أو قِس مرة أخرى.',
  'run.sound.hint.denied': 'تم رفض إذن الميكروفون.',
  'run.sound.hint.tapRecord': 'اضغط تسجيل لبدء القياس.',
  'run.sound.alert.permissionTitle': 'تم رفض إذن الميكروفون',
  'run.sound.alert.permissionMessage':
    'يجب أن تسمح بالوصول إلى الميكروفون لقياس مستويات الصوت.',
  'run.sound.alert.noPermissionTitle': 'لا يوجد إذن',
  'run.sound.alert.noPermissionMessage': 'إذن الميكروفون مطلوب.',
  'run.sound.alert.startFailTitle': 'تعذر بدء التسجيل',
  'run.sound.alert.startFailMessage': 'يرجى المحاولة مرة أخرى.',
  'run.sound.alert.stopFailTitle': 'تعذر إيقاف التسجيل',
  'run.sound.alert.stopFailMessage': 'يرجى المحاولة مرة أخرى.',
  'run.sound.alert.missingActionTitle': 'إجراء ناقص',
  'run.sound.alert.missingActionMessage': 'يرجى إدخال ما كنت تقيسه.',
  'run.sound.alert.noMeasurementTitle': 'لا يوجد قياس',
  'run.sound.alert.noMeasurementMessage': 'سجّل مستوى صوت قبل إضافة الإدخال.',
  'run.sound.alert.noEntriesTitle': 'لا توجد إدخالات',
  'run.sound.alert.noEntriesMessage': 'أضف إدخالًا واحدًا على الأقل قبل الإنهاء.',

  'run.reaction.heading': 'لوحة ردود الفعل – مرحلة النقر',
  'run.reaction.subheading':
    'اضغط ابدأ، انتظر الإشارة الخضراء، ثم انقر بأسرع ما يمكنك.',
  'run.reaction.area.idle': 'اضغط ابدأ للبدء',
  'run.reaction.area.waiting': 'انتظر الأخضر…',
  'run.reaction.area.go': 'انقر الآن!',
  'run.reaction.area.tooSoon': 'مبكر جدًا! حاول مرة أخرى.',
  'run.reaction.area.resultSub': 'نقرة جيدة!',
  'run.reaction.start': 'ابدأ',
  'run.reaction.tryAgain': 'حاول مرة أخرى',
  'run.reaction.cancel': 'إلغاء',
  'run.reaction.stat.attempts': 'المحاولات',
  'run.reaction.stat.best': 'الأفضل',
  'run.reaction.stat.average': 'المتوسط',
  'run.reaction.attemptsHeading': 'المحاولات في هذه الجلسة ({{count}})',
  'run.reaction.empty': 'لا توجد محاولات بعد.',
  'run.reaction.attemptLabel': 'المحاولة {{n}}',
  'run.reaction.finish': 'إنهاء النشاط',
  'run.reaction.alert.noAttemptsTitle': 'لا توجد محاولات',
  'run.reaction.alert.noAttemptsMessage':
    'جرّب نقرة واحدة على الأقل قبل الإنهاء.',

  'run.earthquake.heading': 'هيكل مقاوم للزلازل',
  'run.earthquake.subheading':
    'ضع الهاتف على هيكلك، اختر وضعًا، ثم اضغط بدء الاختبار. اضغط إيقاف لتسجيل النتيجة.',
  'run.earthquake.mode.manual': 'يدوي',
  'run.earthquake.mode.simulate': 'محاكاة الزلزال',
  'run.earthquake.meter.live': 'الاهتزاز المباشر',
  'run.earthquake.meter.lastPeak': 'آخر ذروة',
  'run.earthquake.hint.simulating':
    'الهاتف يهتز… اضغط إيقاف عند انتهاء الاختبار.',
  'run.earthquake.hint.shaking': 'يهتز… اضغط إيقاف عند انتهاء الاختبار.',
  'run.earthquake.hint.complete': 'اكتمل الاختبار. أضف محاولة أخرى أو أنهِ.',
  'run.earthquake.hint.unavailable':
    'مقياس التسارع غير متاح على هذا الجهاز.',
  'run.earthquake.hint.simulatePrompt':
    'ضع الهاتف على الهيكل ثم اضغط بدء الاختبار للاهتزاز.',
  'run.earthquake.hint.manualPrompt':
    'ضع الهاتف على الهيكل، اضغط بدء الاختبار وحرّك بقوة.',
  'run.earthquake.stat.time': 'الزمن',
  'run.earthquake.stat.peak': 'الذروة',
  'run.earthquake.stat.average': 'المتوسط',
  'run.earthquake.start': 'بدء الاختبار',
  'run.earthquake.stop': 'إيقاف الاختبار',
  'run.earthquake.attemptsHeading': 'المحاولات في هذه الجلسة ({{count}})',
  'run.earthquake.empty': 'لا توجد محاولات بعد.',
  'run.earthquake.attemptLabel': 'المحاولة {{n}}',
  'run.earthquake.entryPeak': 'الذروة {{value}} g',
  'run.earthquake.entrySub': '{{seconds}} ث · متوسط {{avg}} g',
  'run.earthquake.finish': 'إنهاء النشاط',
  'run.earthquake.alert.unavailableTitle': 'مقياس التسارع غير متاح',
  'run.earthquake.alert.unavailableMessage':
    'هذا الجهاز لا يوفر بيانات مقياس التسارع.',
  'run.earthquake.alert.noDataTitle': 'لا توجد بيانات',
  'run.earthquake.alert.noDataMessage': 'لم يتم التقاط أي عينات من مقياس التسارع.',
  'run.earthquake.alert.noAttemptsTitle': 'لا توجد محاولات',
  'run.earthquake.alert.noAttemptsMessage':
    'قم بإجراء اختبار واحد على الأقل قبل الإنهاء.',

  'result.common.latest': 'آخر محاولة',
  'result.common.savedAt': 'تم الحفظ {{when}}',
  'result.common.totalAttempts': 'إجمالي المحاولات المحفوظة: {{count}}',
  'result.common.empty': 'لم يتم حفظ أي محاولات بعد.',
  'result.common.back': 'العودة إلى الأنشطة',

  'result.sound.entries': 'الإدخالات',
  'result.sound.loudest': 'الأعلى',
  'result.sound.quietest': 'الأهدأ',
  'result.sound.average': 'المتوسط',
  'result.sound.listHeading': 'مستويات الصوت المسجلة',

  'result.reaction.taps': 'النقرات',
  'result.reaction.best': 'الأفضل',
  'result.reaction.slowest': 'الأبطأ',
  'result.reaction.average': 'المتوسط',
  'result.reaction.listHeading': 'أزمنة الاستجابة',
  'result.reaction.attemptLabel': 'المحاولة {{n}}',

  'result.earthquake.tests': 'الاختبارات',
  'result.earthquake.bestPeak': 'الأفضل (أدنى ذروة)',
  'result.earthquake.worstPeak': 'الأسوأ (أعلى ذروة)',
  'result.earthquake.meanPeak': 'متوسط الذروة',
  'result.earthquake.meanShake': 'متوسط الاهتزاز',
  'result.earthquake.listHeading': 'الاختبارات المنفذة',
  'result.earthquake.attemptLabel': 'المحاولة {{n}}',
  'result.earthquake.entryPeak': 'الذروة {{value}} g',
  'result.earthquake.entrySub': '{{seconds}} ث · متوسط {{avg}} g',

  'summary.heading': 'تم إكمال النشاط',
  'summary.resultLabel': 'النتيجة',
  'summary.teamMeta': 'الفريق: {{name}} · {{count}} {{member}}',
  'summary.rate': 'قيّم هذه التجربة',
  'summary.reflection': 'تأمل (اختياري)',
  'summary.reflectionPlaceholder': 'ماذا لاحظت؟ ماذا ستغير؟',
  'summary.save': 'حفظ النتيجة',
  'summary.saving': 'جارٍ الحفظ…',
  'summary.alert.noTeamTitle': 'لا يوجد فريق',
  'summary.alert.noTeamMessage': 'أعدّ فريقًا قبل حفظ النتائج.',
  'summary.alert.saveFailTitle': 'فشل الحفظ',
  'summary.alert.saveFailMessage':
    'تعذر حفظ نتيجتك. يرجى المحاولة مرة أخرى.',

  'history.heading': 'السجل',
  'history.subheading': 'جميع المحاولات المحفوظة عبر الأنشطة.',
  'history.filter.all': 'الكل',
  'history.empty.noResultsTitle': 'لا توجد نتائج بعد',
  'history.empty.noResultsMessage':
    'أنهِ نشاطًا لرؤية سجلك ينمو.',
  'history.empty.noFilteredTitle': 'لا توجد محاولات هنا',
  'history.empty.noFilteredMessage':
    'لا توجد محاولات محفوظة لهذا النشاط بعد.',
  'history.error.title': 'تعذر تحميل السجل',
  'history.error.message':
    'حدث خطأ أثناء قراءة النتائج المحفوظة. حاول لاحقًا.',

  'leaderboard.heading': 'المتصدرون',
  'leaderboard.lowerBetter': 'الأقل أفضل',
  'leaderboard.higherBetter': 'الأعلى أفضل',
  'leaderboard.stat.attempts': 'المحاولات',
  'leaderboard.stat.best': 'الأفضل',
  'leaderboard.stat.average': 'المتوسط',
  'leaderboard.empty.title': 'لا توجد بيانات',
  'leaderboard.empty.message':
    'أنهِ نشاطًا لرؤية النتائج المرتبة هنا.',
  'leaderboard.error.title': 'تعذر تحميل لوحة المتصدرين',
  'leaderboard.error.message':
    'حدث خطأ أثناء قراءة النتائج المحفوظة. حاول لاحقًا.',

  'settings.heading': 'الإعدادات',
  'settings.subheading': 'المظهر والوصول وخيارات إعادة التعيين.',
  'settings.section.display': 'العرض',
  'settings.section.language': 'اللغة',
  'settings.section.team': 'الفريق',
  'settings.section.data': 'البيانات',
  'settings.darkMode': 'الوضع الداكن',
  'settings.largeText': 'نص كبير',
  'settings.largeTextHint': 'يزيد أحجام الخطوط في التطبيق لتحسين القراءة.',
  'settings.resetTeam': 'إعادة تعيين الفريق',
  'settings.clearResults': 'مسح جميع النتائج',
  'settings.team.current': 'الفريق الحالي: {{name}} ({{count}} {{member}})',
  'settings.team.memberSingular': 'عضو',
  'settings.team.memberPlural': 'أعضاء',
  'settings.team.none': 'لم يتم إعداد فريق.',
  'settings.alert.resetTeam.title': 'إعادة تعيين الفريق؟',
  'settings.alert.resetTeam.message':
    'سيؤدي ذلك إلى تسجيل خروج الفريق الحالي. سيتم الاحتفاظ بالنتائج المحفوظة.',
  'settings.alert.clearResults.title': 'مسح جميع النتائج؟',
  'settings.alert.clearResults.message':
    'سيؤدي هذا إلى حذف كل محاولة محفوظة بشكل دائم عبر جميع الأنشطة. لا يمكن التراجع عن هذا.',
  'settings.alert.cleared.title': 'تم',
  'settings.alert.cleared.message': 'تم مسح جميع النتائج المحفوظة.',
  'settings.alert.error': 'خطأ',
  'settings.alert.resetError': 'تعذرت إعادة تعيين الفريق. حاول مرة أخرى.',
  'settings.alert.clearError': 'تعذر مسح النتائج. حاول مرة أخرى.',

  'common.cancel': 'إلغاء',
  'common.reset': 'إعادة تعيين',
  'common.clear': 'مسح',
};

const zh: TranslationDict = {
  'tab.home': '首页',
  'tab.leaderboard': '排行榜',
  'tab.history': '历史',
  'tab.settings': '设置',

  'nav.activityDetail': '活动',
  'nav.activityRun': '运行活动',
  'nav.activityResult': '结果',
  'nav.resultSummary': '保存结果',
  'nav.teamSetup': '团队设置',

  'welcome.title': '欢迎使用 STEMM Lab',
  'welcome.subtitle': '真实世界的 STEMM 活动，游戏化。',
  'welcome.cta': '开始',

  'teamSetup.title': '团队设置',
  'teamSetup.subtitle': '在开始探索活动之前，先告诉我们你的团队信息。',
  'teamSetup.teamName': '团队名称',
  'teamSetup.teamNamePlaceholder': '例如：实验室小队',
  'teamSetup.members': '成员',
  'teamSetup.memberPlaceholder': '成员 {{n}}',
  'teamSetup.removeMember': '移除',
  'teamSetup.addMember': '+ 添加成员',
  'teamSetup.grade': '年级',
  'teamSetup.gradePlaceholder': '例如：九年级',
  'teamSetup.save': '保存并继续',
  'teamSetup.saving': '保存中...',
  'teamSetup.alert.missingTitle': '缺少信息',
  'teamSetup.alert.missingName': '请输入团队名称。',
  'teamSetup.alert.missingMembers': '请至少添加一名成员。',
  'teamSetup.alert.missingGrade': '请输入年级或就读年份。',
  'teamSetup.alert.errorTitle': '错误',
  'teamSetup.alert.errorMessage': '无法保存团队。请重试。',

  'home.heading': '活动',
  'home.subheading': '选择一个 STEMM 挑战开始吧。',
  'home.comingSoon': '即将推出',

  'category.Engineering': '工程',
  'category.Health': '健康',

  'activity.parachute.title': '降落伞投放挑战',
  'activity.parachute.domain': '工程 + 物理',
  'activity.parachute.shortDescription': '设计并测试降落伞，尽量减小落地速度和冲击力。',
  'activity.parachute.shortLabel': '降落伞',

  'activity.sound.title': '噪声污染追踪者',
  'activity.sound.domain': '环境科学',
  'activity.sound.shortDescription': '测量并比较不同动作和地点的声音水平。',
  'activity.sound.shortLabel': '声音',

  'activity.handfan.title': '手扇挑战',
  'activity.handfan.domain': '物理 – 空气流动',
  'activity.handfan.shortDescription':
    '在固定距离用扇子吹向目标，并记录倾斜角度。',
  'activity.handfan.shortLabel': '手扇',

  'activity.earthquake.title': '抗震结构',
  'activity.earthquake.domain': '工程 + 地球科学',
  'activity.earthquake.shortDescription':
    '搭建吸震平台，测量手机在模拟地震期间的运动。',
  'activity.earthquake.shortLabel': '地震',

  'activity.performance.title': '人体表现实验室',
  'activity.performance.domain': '医学科学 + 生物力学',
  'activity.performance.shortDescription':
    '使用加速计测量缓慢与快速动作中的平稳度。',
  'activity.performance.shortLabel': '表现',

  'activity.reaction.title': '反应板挑战',
  'activity.reaction.domain': '神经科学 + 数学',
  'activity.reaction.shortDescription':
    '在三个阶段中测试反应时间、协调性以及进步情况。',
  'activity.reaction.shortLabel': '反应',

  'activity.breathing.title': '呼吸节奏训练',
  'activity.breathing.domain': '医学科学',
  'activity.breathing.shortDescription':
    '使用加速计测量休息时和运动后的呼吸频率。',
  'activity.breathing.shortLabel': '呼吸',

  'activityDetail.startBtn': '开始活动',
  'activityDetail.notice': '此活动将在后续阶段添加。',
  'activityDetail.notFound': '未找到活动',
  'activityRun.notPlayable': '此活动尚未可玩。',
  'activityResult.none': '此活动没有可显示的结果。',

  'run.sound.heading': '噪声污染追踪者',
  'run.sound.subheading': '输入你正在测量的内容，然后录制几秒钟的声音。',
  'run.sound.action': '动作',
  'run.sound.actionPlaceholder': '例如：午餐铃声',
  'run.sound.level': '声音水平',
  'run.sound.record': '录制',
  'run.sound.stop': '停止',
  'run.sound.addEntry': '添加记录',
  'run.sound.entriesHeading': '本次记录数 ({{count}})',
  'run.sound.empty': '尚无记录。',
  'run.sound.finish': '完成活动',
  'run.sound.hint.listening': '正在听取…完成时点击停止。',
  'run.sound.hint.captured': '已捕获。添加记录或重新测量。',
  'run.sound.hint.denied': '麦克风权限被拒绝。',
  'run.sound.hint.tapRecord': '点击录制开始测量。',
  'run.sound.alert.permissionTitle': '麦克风权限被拒绝',
  'run.sound.alert.permissionMessage': '需要允许麦克风访问才能测量声音水平。',
  'run.sound.alert.noPermissionTitle': '无权限',
  'run.sound.alert.noPermissionMessage': '需要麦克风权限。',
  'run.sound.alert.startFailTitle': '无法开始录制',
  'run.sound.alert.startFailMessage': '请重试。',
  'run.sound.alert.stopFailTitle': '无法停止录制',
  'run.sound.alert.stopFailMessage': '请重试。',
  'run.sound.alert.missingActionTitle': '缺少动作',
  'run.sound.alert.missingActionMessage': '请输入你正在测量的内容。',
  'run.sound.alert.noMeasurementTitle': '无测量',
  'run.sound.alert.noMeasurementMessage': '添加记录前请先录制声音水平。',
  'run.sound.alert.noEntriesTitle': '无记录',
  'run.sound.alert.noEntriesMessage': '完成前请至少添加一条记录。',

  'run.reaction.heading': '反应板 – 点击阶段',
  'run.reaction.subheading': '点击开始，等待绿色信号，然后尽快点击。',
  'run.reaction.area.idle': '按开始以启动',
  'run.reaction.area.waiting': '等待绿色…',
  'run.reaction.area.go': '立即点击！',
  'run.reaction.area.tooSoon': '太早了！再试一次。',
  'run.reaction.area.resultSub': '点得不错！',
  'run.reaction.start': '开始',
  'run.reaction.tryAgain': '再试一次',
  'run.reaction.cancel': '取消',
  'run.reaction.stat.attempts': '次数',
  'run.reaction.stat.best': '最佳',
  'run.reaction.stat.average': '平均',
  'run.reaction.attemptsHeading': '本次尝试次数 ({{count}})',
  'run.reaction.empty': '尚无尝试。',
  'run.reaction.attemptLabel': '第 {{n}} 次',
  'run.reaction.finish': '完成活动',
  'run.reaction.alert.noAttemptsTitle': '无尝试',
  'run.reaction.alert.noAttemptsMessage': '完成前请至少尝试一次点击。',

  'run.earthquake.heading': '抗震结构',
  'run.earthquake.subheading':
    '将手机放在结构上，选择模式，然后点击开始测试。点击停止以记录结果。',
  'run.earthquake.mode.manual': '手动',
  'run.earthquake.mode.simulate': '模拟地震',
  'run.earthquake.meter.live': '实时震动',
  'run.earthquake.meter.lastPeak': '上次峰值',
  'run.earthquake.hint.simulating': '手机正在震动…测试完成时点击停止。',
  'run.earthquake.hint.shaking': '正在晃动…测试完成时点击停止。',
  'run.earthquake.hint.complete': '测试完成。再试一次或结束。',
  'run.earthquake.hint.unavailable': '此设备无法使用加速计。',
  'run.earthquake.hint.simulatePrompt':
    '将手机放在结构上，然后点击开始测试以使其震动。',
  'run.earthquake.hint.manualPrompt':
    '将手机放在结构上，点击开始测试并晃动。',
  'run.earthquake.stat.time': '时间',
  'run.earthquake.stat.peak': '峰值',
  'run.earthquake.stat.average': '平均',
  'run.earthquake.start': '开始测试',
  'run.earthquake.stop': '停止测试',
  'run.earthquake.attemptsHeading': '本次尝试次数 ({{count}})',
  'run.earthquake.empty': '尚无尝试。',
  'run.earthquake.attemptLabel': '第 {{n}} 次',
  'run.earthquake.entryPeak': '峰值 {{value}} g',
  'run.earthquake.entrySub': '{{seconds}} 秒 · 平均 {{avg}} g',
  'run.earthquake.finish': '完成活动',
  'run.earthquake.alert.unavailableTitle': '加速计不可用',
  'run.earthquake.alert.unavailableMessage': '此设备未提供加速计数据。',
  'run.earthquake.alert.noDataTitle': '无数据',
  'run.earthquake.alert.noDataMessage': '未捕获任何加速计样本。',
  'run.earthquake.alert.noAttemptsTitle': '无尝试',
  'run.earthquake.alert.noAttemptsMessage': '完成前请至少进行一次测试。',

  'result.common.latest': '最近一次',
  'result.common.savedAt': '已保存于 {{when}}',
  'result.common.totalAttempts': '已保存的尝试总数：{{count}}',
  'result.common.empty': '尚未保存任何尝试。',
  'result.common.back': '返回活动',

  'result.sound.entries': '记录数',
  'result.sound.loudest': '最响',
  'result.sound.quietest': '最静',
  'result.sound.average': '平均',
  'result.sound.listHeading': '已记录的声音水平',

  'result.reaction.taps': '点击数',
  'result.reaction.best': '最佳',
  'result.reaction.slowest': '最慢',
  'result.reaction.average': '平均',
  'result.reaction.listHeading': '反应时间',
  'result.reaction.attemptLabel': '第 {{n}} 次',

  'result.earthquake.tests': '测试数',
  'result.earthquake.bestPeak': '最佳（最低峰值）',
  'result.earthquake.worstPeak': '最差（最高峰值）',
  'result.earthquake.meanPeak': '平均峰值',
  'result.earthquake.meanShake': '平均震动',
  'result.earthquake.listHeading': '测试运行',
  'result.earthquake.attemptLabel': '第 {{n}} 次',
  'result.earthquake.entryPeak': '峰值 {{value}} g',
  'result.earthquake.entrySub': '{{seconds}} 秒 · 平均 {{avg}} g',

  'summary.heading': '活动已完成',
  'summary.resultLabel': '结果',
  'summary.teamMeta': '团队：{{name}} · {{count}} {{member}}',
  'summary.rate': '为这次实验评分',
  'summary.reflection': '反思（可选）',
  'summary.reflectionPlaceholder': '你注意到了什么？你会改变什么？',
  'summary.save': '保存结果',
  'summary.saving': '保存中…',
  'summary.alert.noTeamTitle': '没有团队',
  'summary.alert.noTeamMessage': '保存结果前请先设置团队。',
  'summary.alert.saveFailTitle': '保存失败',
  'summary.alert.saveFailMessage': '无法保存你的结果。请重试。',

  'history.heading': '历史',
  'history.subheading': '所有活动中已保存的尝试。',
  'history.filter.all': '全部',
  'history.empty.noResultsTitle': '尚无结果',
  'history.empty.noResultsMessage': '完成一个活动后，你的历史就会增长。',
  'history.empty.noFilteredTitle': '此处没有尝试',
  'history.empty.noFilteredMessage': '此活动尚未保存任何尝试。',
  'history.error.title': '无法加载历史',
  'history.error.message': '读取已保存的结果时出错。请稍后再试。',

  'leaderboard.heading': '排行榜',
  'leaderboard.lowerBetter': '越低越好',
  'leaderboard.higherBetter': '越高越好',
  'leaderboard.stat.attempts': '次数',
  'leaderboard.stat.best': '最佳',
  'leaderboard.stat.average': '平均',
  'leaderboard.empty.title': '暂无数据',
  'leaderboard.empty.message': '完成一个活动以查看此处的排名结果。',
  'leaderboard.error.title': '无法加载排行榜',
  'leaderboard.error.message': '读取已保存的结果时出错。请稍后再试。',

  'settings.heading': '设置',
  'settings.subheading': '主题、辅助功能和重置选项。',
  'settings.section.display': '显示',
  'settings.section.language': '语言',
  'settings.section.team': '团队',
  'settings.section.data': '数据',
  'settings.darkMode': '深色模式',
  'settings.largeText': '大字号',
  'settings.largeTextHint': '在整个应用中增大字号以提升可读性。',
  'settings.resetTeam': '重置团队',
  'settings.clearResults': '清除所有结果',
  'settings.team.current': '当前团队：{{name}}（{{count}} {{member}}）',
  'settings.team.memberSingular': '名成员',
  'settings.team.memberPlural': '名成员',
  'settings.team.none': '尚未设置团队。',
  'settings.alert.resetTeam.title': '重置团队？',
  'settings.alert.resetTeam.message': '这将注销当前团队。已保存的结果将被保留。',
  'settings.alert.clearResults.title': '清除所有结果？',
  'settings.alert.clearResults.message':
    '这将永久删除所有活动中的每一次保存的尝试。此操作无法撤销。',
  'settings.alert.cleared.title': '完成',
  'settings.alert.cleared.message': '所有已保存的结果都已清除。',
  'settings.alert.error': '错误',
  'settings.alert.resetError': '无法重置团队。请重试。',
  'settings.alert.clearError': '无法清除结果。请重试。',

  'common.cancel': '取消',
  'common.reset': '重置',
  'common.clear': '清除',
};

export const translations: Record<LanguageCode, TranslationDict> = { en, es, ar, zh };

export function translate(
  language: LanguageCode,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = translations[language] ?? translations.en;
  let str = dict[key] ?? translations.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{{${k}}}`).join(String(v));
    }
  }
  return str;
}
