import { logTramites } from './logTramites.js';
import AccordionResultadosAuxiliares from './AccordionResultadosAuxiliares.jsx';
// Modal simple reutilizable
function Modal({ open, onClose, children, width = '60vw', minWidth = 320, maxWidth = 1300 }) {
  if (!open) return null;
  // Handler para cerrar al clickear fuera del modal
  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }
    // Detectar theme global (por prop o window)
    let theme = 'light';
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) theme = 'dark';
    return (
      <div
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onClick={handleBackdropClick}
      >
        <div style={{
          background: theme === 'dark' ? '#23272f' : '#fff',
          borderRadius: 16,
          padding: 32,
          minWidth: minWidth,
          width: width,
          maxWidth: maxWidth,
          boxShadow: '0 2px 24px #0004',
          position: 'relative',
          maxHeight: '92vh',
          height: 'auto',
          minHeight: 320,
          overflowY: 'auto',
          fontSize: '14px'
        }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 18, background: 'none', border: 'none', fontSize: 28, fontWeight: 700, color: '#1976d2', cursor: 'pointer', zIndex: 2 }}>&times;</button>
          {children}
        </div>
      </div>
    );
}
import { useState, useEffect, useRef } from 'react';
let API = import.meta.env.VITE_API_URL;
if (API && !API.endsWith('/')) API = API + '/';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import './App.css';
// Fallback JSON for plantillas (consultas) - completo
const PLANTILLAS_FALLBACK = 	{
		"consultas":[
		{
			"id": 1,
			"nombre": "INSCRIPCION INGRESANTES",
			"descripcion": "Si estás interesado en ser estudiante de alguna carrera de grado de la Universidad Nacional de Moreno y todavía no te inscribiste en ninguna carrera, podrás encontrar la información acerca de cómo  hacer tu inscripción  en el siguiente enlace que te lleva a nuestro sitio web.\nAllí podrás encontrar las respuestas acerca de como inscribirse en la UNM.\n\nCarreras\nPreguntas Frecuentes\nCurso de Orientación y Preparación Universitaria (COPRUN)\nMayores de 25 años\nProceso de Inscripción y validación de documentación\nDocumentación Requerida\nRequisitos para los Ciclos de Licenciaturas",
			"url": "http://www.unm.edu.ar/index.php/ingresantes"
		  },
		{
			"id": 2,
			"nombre": "INSCRIPCIÓN A ASIGNATURAS",
			"descripcion": "En el Calendario Académico podrás encontrar las fechas de inscripciones a asignaturas antes de comenzar cada cuatrimestre.\nPara saber en qué fechas te corresponde inscribirte debes tener en cuenta la siguiente información:\nLa inscripción en calidad de INGRESANTES es para aquellos que recién han finalizado el COPRUN y en la primera instancia inmediata de inscripciones a asignaturas de la carrera, gestiona la inscripción.\nSi hubieras realizado un cambio o simultaneidad de carreras y es tu primer cuatrimestre en la carrera también realizarás tu inscripción en calidad de INGRESANTE.\nLos estudiantes que deberán inscribirse en  las fechas previstas  para NO INGRESANTES son aquellos que  ya realizaron gestiones de inscripción a asignaturas de la carrera de grado en períodos de anteriores."
		},
		{
			"id": 3,
			"nombre": "PROCESO DE INSCRIPCIONES A ASIGNATURAS",
			"descripcion": "La grilla de oferta de asignaturas de carreras de grado de cada período de cursada se publica en nuestra página web, con el correspondiente detalle que informa materias, comisiones, días y horarios de cursadas.\n\nEn el Calendario Académico de la UNM, están informadas las fechas de cada llamado de inscripción a asignaturas de las carreras de grado, para cada período del ciclo lectivo.\n\nEn el primer llamado, las pre-inscripciones que realiza el estudiante desde su sesión de GESTIÓN ONLINE a asignaturas le permiten indicar hasta tres opciones de comisiones de la oferta total de comisiones disponibles de una asignatura, que cuente con varias comisiones en distintos días y horarios.\n\nEl estudiante deberá elegir solo las opciones de días y horarios en las que efectivamente pueda cursar, ya que cualquiera de las opciones que elija podrán quedar aceptadas.\n\nLuego, en las fechas previstas por el calendario de 'Publicación Inscripción asignaturas del primer llamado', podrán ver cuáles de sus pre-inscripciones a comisiones quedaron aceptadas, ya que son las que podrá cursar.\n\nEn el caso de que alguna de tus inscripciones gestionadas desde tu sesión de gestión online en ese primer llamado no hubiera quedado aceptada, deberás volver a tramitar la inscripción en el segundo llamado. Ya que el proceso de inscripción finaliza recién al culminar este último. Este segundo llamado de inscripción es de aceptación automática, por lo cual en el mismo momento de la inscripción a las materias y comisiones que cuenten con disponibilidad, quedará esa inscripción aceptada.\n\nSi tuviera algún inconveniente a la hora de inscribirse en el segundo llamado de inscripción a asignaturas, deberás comunicarte con el departamento de tu carrera.\n\nDEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS\ndceyj@unm.edu.ar\nDEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA\ndcayt@unm.edu.ar\nDEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES\ndhycs@unm.edu.ar"
		},
		{
			"id": 4,
			"nombre": "OFERTA ACADEMICA",
			"descripcion": "En nuestro sitio web se encuentra publicada la oferta académica con la información de cada asignatura.\n",
			"url":"https://www.unm.edu.ar/index.php/destacados/3117-oferta-academica-primer-cuatrimestre-2025"
		},
		{
			"id": 5,
			"nombre": "INSCRIPCIÓN A FINALES REGULARES Y LIBRES",
			"descripcion":"La inscripción a exámenes finales se realiza en 3(tres) momentos del año.\nTurnos: Febrero-Marzo / Julio / Diciembre\n\nLos finales pueden rendirse de manera REGULAR o LIBRE en las mismas mesas previstas para cada asignatura. \n\nLos períodos de inscripción y desarrollo de los exámenes finales se encuentran informados en el CALENDARIO ACADÉMICO.\n\nREGULARES: Recordá que en cada turno de finales SIEMPRE deberás inscribirte en el llamado que desees a través del SIU-Guaraní de la misma manera en que te inscribís a asignaturas y sólo podés elegir una de las mesas del turno.\n\nLIBRES: Si cursaste una asignatura y el resultado fue: ABANDONÓ, AUSENTE o LIBRE, o NUNCA la cursaste, el sistema aceptará la inscripción al examen final en calidad de LIBRE, siempre y cuando el Plan de Estudios de tu carrera lo admita (ver en el programa de la asignatura el régimen de aprobación).\n\nSiempre que tengas inconvenientes a la hora de realizar una inscripción podrás comunicarte con el Departamento de Alumnos antes de que finalice el período."
		},
		{
			"id": 6,
			"nombre": "INICIO DEL TRÁMITE DEL TÍTULO",
			"descripcion": "Una vez que hayas cumplido con el 100% del requerimiento de asignaturas aprobadas que prevé el plan de estudios de tu carrera, para dar inicio al trámite de solicitud del título de GRADO o PRE-GRADO deberás comunicarte con la Departamento de Títulos a través de su correo titulos@unm.edu.ar. \nEn dicha área te indicarán los requisitos para iniciar dicha tramitación."
		},
		{
			"id": 7,
			"nombre": "SOLICITUD DE EQUIVALENCIAS",
			"descripcion":"RÉGIMEN DE EQUIVALENCIAS\nARTÍCULO 28.- La UNIVERSIDAD NACIONAL DE MORENO podrá otorgar el reconocimiento total de las obligaciones académicas equivalentes que hayan sido aprobadas por sus alumnos regulares en la misma o en otra u otras Universidades argentinas debidamente reconocidas, tanto nacionales, privadas o provinciales, así como del extranjero que posean reconocimiento oficial en su país de origen.\nEl reconocimiento de obligaciones académicas equivalentes que hayan sido aprobadas en otra u otras Universidades se registrará sin calificación numérica.\nARTÍCULO 29.- Para solicitar dicho reconocimiento, el interesado deberá presentar ante la SECRETARÍA ACADÉMICA un requerimiento por escrito, en el que deberá enunciar qué asignaturas del Plan de Estudios de su Carrera, solicita sean reconocidas como equivalentes a otras obligaciones curriculares que haya aprobado en otras instituciones, exponer los fundamentos que motivan su solicitud y adjuntar la siguiente documentación:\na) Copia debidamente certificada del Plan de Estudios de la Carrera cursada, con indicación de la carga horaria de cada obligación curricular.\nb) Certificado analítico emitido por la Universidad de origen y suscrito por autoridad competente en el que consten las asignaturas rendidas y las calificaciones definitivas obtenidas, indicando la fecha de los exámenes finales e incluidas las reprobadas o con calificación de insuficiente y demás actividades y obligaciones académicas realizadas.\nc) Constancia de la inexistencia o no de sanciones disciplinarias.\nd) Copia debidamente certificada de los programas correspondientes a las asignaturas aprobadas, y que ostenten la constancia de que son aquellos según los cuales fuera rendido el examen correspondiente.\nARTÍCULO 32.- La UNIVERSIDAD NACIONAL DE MORENO reconocerá por equivalencias una cantidad de asignaturas tal que no exceda en ningún caso el 30% (treinta por ciento) del total de las obligaciones curriculares que integran el Plan de Estudios de la Carrera en cuestión.\nARTÍCULO 33.- Será admisible la solicitud del reconocimiento de equivalencias de asignaturas promovidas en otra Universidad, en tanto hayan sido aprobadas dentro de los últimos diez (10) años anteriores al del ciclo lectivo de la solicitud.\nPara solicitar equivalencias necesitás solicitar en la institución donde estudiaste la documentación enumerada en el artículo 29 del Reglamento de Alumnos.Una vez que tenés la documentación en tu poder, vas a descargar el formulario que se encuentra al final del correo, completarlo y enviarlo al departamento de tu carrera para solicitar la autorización.\nEn el departamento de tu carrera, cuyos correos vas a encontrar a continuación, podrás consultar acerca de las asignaturas que puedan ser equivalentes con las de la carrera que cursaste.\n\nDEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS\ndceyj@unm.edu.ar\nDEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA\ndcayt@unm.edu.ar\nDEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES\ndhycs@unm.edu.ar\nUna vez autorizado vas a presentarlo junto con la documentación completa en el Departamento de Alumnos para dar comienzo a tu trámite.",
			"url": "https://drive.google.com/file/d/1Pk52yq_refwT74nxRra7eFiGkz16ZWST/view?usp=drive_link"
		},
		{
			"id": 8,
			"nombre": "CONSULTAS A BIENESTAR UNIVERSITARIO",
			"descripcion": "Para consultas sobre:\n\nBecas Internas\nBecas Externas\nDeporte Universitario\nBolsa de trabajo y pasantías\nPrograma Comunidad UNM\nConvivencia Universitaria\nBoleto estudiantil\n\ntenés que comunicarte con el Departamento de Bienestar Universitario a través del correo electrónico: bienestaruniversitario@unm.edu.ar"
		},
		{ 	"id": 9,
			"nombre": "REGULARIDAD",
			"descripcion": "Como estipula el Reglamento de Alumnos: \n\nARTÍCULO 20.- Aquellos alumnos en condición regular en una asignatura deberán rendir su examen final para promoverla, en cualquiera de los Turnos de Exámenes dentro del plazo de 2(dos) años, a computar desde la fecha del primer llamado posterior a la fecha de regularización de la materia.\n\nARTÍCULO 21.- El alumno que no hubiere aprobado su examen final en el plazo previsto en el artículo 16 y/o hubiera reprobado en 3 (tres) oportunidades su examen final, perderá la regularidad en la asignatura y deberá recursarla, con excepción de las 2 (dos) últimas unidades curriculares que pudiere adeudar de su Plan de Estudios. Esta circunstancia no afectará su inscripción y condición en relación a las obligaciones curriculares correlativas.\n\nARTÍCULO 22.- El CONSEJO del DEPARTAMENTO ACADÉMICO correspondiente, podrá conceder una prórroga o nueva oportunidad de examen final, previa solicitud debidamente justificada del interesado y dictamen del titular de la asignatura.En caso de la denegatoria, el interesado podrá interponer recurso por escrito ante la SECRETARÍA ACADÉMICA\n\nARTÍCULO 23.- El alumno que optare por recursar una materia en condición regular, a efectos de su promoción mediante el régimen de regularidad, perderá la condición de regular en la materia obtenida con anterioridad. No se admitirá la inscripción para recursar una materia en condición regular, antes del plazo de 1 (un) año a computar desde la fecha de su regularización, con excepción de aquellos alumnos que se encuentren en condición de cursar hasta las 2 (dos) últimas obligaciones académicas para obtener el respectivo título de grado."
		},		
		{
			"id": 10,
			"nombre": "MODIFICACIÓN DE DATOS PERSONALES",
			"descripcion": "Si deseas solicitar Modificación de Datos en el sistema, deberás presentarte con tu DNI (original y copia) en el Departamento de Alumnos para completar un formulario de solicitud."
		},
		{
			"id": 11,
			"nombre": "SOLICITAR CONSTANCIAS O CERTIFICADOS",
			"descripcion":"Para solicitar Certificado de Alumno Regular o de Asignaturas Rendidas, seguí los pasos que a continuación se detallan:\n\n1. Accede dentro del SIU-GUARANÍ en la pestaña TRÁMITES.\n\n2. Selecciona la opción 'Solicitar Constancias y Certificados'.\n\n3. Haz clic en el botón 'NUEVA SOLICITUD'.\n\n4. Completa el formulario con tu información de la constancia o certificado que necesitas.\n\n5. Verifica que toda la información sea correcta y confirma la solicitud.\n\n6. El sistema generará automáticamente la constancia o certificado solicitado para que la descargues."
		},
		{
			"id": 12,
			"nombre": "PROCESO DE INSCRIPCIÓN A CARRERAS",
			"descripcion":"De acuerdo a su condición siga los pasos para la preinscripción como a continuación se detallan:\n\n1) ASPIRANTES QUE SE INSCRIBAN POR PRIMERA VEZ EN LA UNM:\n\na) Completar todos los datos solicitados en el formulario online\nb) Adjuntar toda la documentación requerida obligatoria según tu situación en forma digital en el mismo formulario en la pestaña “Documentación”.\nc) Una vez chequeada y guardada la información, deberás clickear en “Finalizar” a fin de confirmar el proceso de preinscripción.\n\nd) La documentación será tomada en carácter condicional hasta tanto pueda validar la misma junto a la documentación original en la Oficina de Alumnos de la Universidad de forma presencial. Para ello, deberás solicitar un turno durante el proceso de inscripción.\n\n2) ASPIRANTES QUE SE HAYAN INSCRIPTO PREVIAMENTE A LA UNM\n\na) Actualizar todos los datos y elegir la carrera, realizando una preinscripción desde el Sistema de Gestión On line, para ello, deberás ingresar directamente a http://gestiononline.unm.edu.ar/unm3w/, ingresar con tu usuario (DNI) y contraseña, si lo has obtenido previamente. Si se ha inscripto a la UNM pero nunca obtuvo su usuario, deberá solicitarlo siguiendo los pasos allí indicados.\nDentro de Gestión online deberás ingresar a Trámites/Preinscripciones.\nTener en cuenta que si ya existe una inscripción previa, para recuperar la contraseña, el Sistema usará el mail registrado en el momento de dicha inscripción. De ser necesario, deberá escribir a alumnos@unm.edu.ar, informando sus datos y solicitando modificación del correo oportunamente registrado.\nDe no recordar que se haya inscripto previamente, se podrá corroborar ingresando directamente por el Formulario Electrónico con el DNI: el Sistema podrá detectar esta situación, redireccionando a hacerlo por esta otra vía.\nb) Adjuntar toda la documentación requerida obligatoria según la situación en forma digital en el mismo formulario en la pestaña “Requisitos”.\nc) Una vez chequeada y guardada la información, deberá guardar los datos a fin de confirmar el proceso de preinscripción.\nd) La documentación será tomada en carácter condicional hasta tanto puedas validarla junto a los originales en la Oficina de Alumnos de la Universidad de forma presencial.\n"
		},
		{
			"id": 13,
			"nombre": "CORREO INSTITUCIONAL",
			"descripcion":"¿Cómo hago para solicitar mi correo institucional?\nPara solicitar tu correo institucional tenés que completar el formulario web que encontrarás al final de la página.\n1. Dentro de las próximas 48hs te va a llegar un correo de la creación del correo institucional.\n\n2. En el correo que te va a llegar vas a encontrar un enlace para confirmar la cuenta (tenés 48hs para confirmar la cuenta desde el momento en que te llega el mensaje).\n\n3. Si no confirmaste la cuenta a tiempo podés escribirnos dando aviso a alumnos@unm.edu.ar , con la misma información solicitada en el formulario.\n\nEl primer ingreso será con tu número de DNI como CONTRASEÑA.",
			"url": "https://forms.gle/XpjiGpqE8XwzCWbH6"
		},
		{
			"id": 14,
			"nombre": "PRIMER LLAMADO - ACEPTADAS O RECHAZADAS",
			"descripcion":"En el caso de que alguna de tus inscripciones gestionadas desde tu sesión de gestión online en ese primer llamado no hubiera quedado aceptada, deberás volver a tramitar la inscripción en el segundo llamado. Ya que el proceso de inscripción finaliza recién al culminar este último. Este segundo llamado de inscripción es directa, por lo que al inscribirse en una asignatura-comisión que cuente con disponibilidad, ya estará aceptado/a en la misma. Si tuvieras algún inconveniente a la hora de inscribirse en el segundo llamado de inscripción a asignaturas, deberás comunicarte con el departamento de tu carrera.\n\nDEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS\n dceyj@unm.edu.ar\nDEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA\n dcayt@unm.edu.ar\nDEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES\n dhycs@unm.edu.ar"
		},
		{
			"id": 15,
			"nombre": "PRIMER LLAMADO - CAMBIO DE COMISIÓN",
			"descripcion":"En caso de haber obtenido la inscripción aceptada en una asignatura/comisión, donde finalmente no podés o no deseás cursar; deberás darte de baja en la comisión en cuestión, antes de finalizar el segundo llamado de inscripción a asignaturas, e inscribirte en la comisión que sea de tu interés. Si tu consulta o duda surge el último día de inscripción o apenas finalizado el último llamado deberás realizar tu consulta al departamento académico de tu carrera. \n\nDEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS\n dceyj@unm.edu.ar\nDEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA\n dcayt@unm.edu.ar\nDEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES\n dhycs@unm.edu.ar"
		},
		{
			"id": 16,
			"nombre": "SEGUNDO LLAMADO DE INSCRIPCIÓN",
			"descripcion":"Este segundo llamado de inscripción es directa, por lo que al inscribirte en una asignatura-comisión que cuente con disponibilidad, ya estarás aceptado/a en la misma. Si tuvieras algún inconveniente a la hora de inscribirte en el segundo llamado de inscripción a asignaturas, deberás comunicarte con el departamento de tu carrera.\n\nDEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS\n dceyj@unm.edu.ar\nDEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA\n dcayt@unm.edu.ar\nDEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES\n dhycs@unm.edu.ar"
		},
		{
			"id": 17,
			"nombre": "CALENDARIO ACADÉMICO",
			"descripcion":"Les recordamos que las fechas de todas las actividades académicas que se desarrollarán en el Ciclo Lectivo 2025, están informadas en el Calendario Académico 2025, publicado en nuestra web, en el apartado de Estudiantes, Calendario Académico, Calendario Académico 2025.Siempre deberán consultar y verificar allí, las fechas correspondientes.",
			"url":"https://www.unm.edu.ar/files/Calendario-Academico-2025-UNM-Oct-2024.pdf"
		},
		{
			"id": 18,
			"nombre": "RECUPERATORIO COPRUN",
			"descripcion":"Las inscripciones para el RECUPERATORIO del COPRUN serán desde el 25 al 31 de marzo. Debe realizar la reinscripción a través de su usuario de SIU-GUARANÍ y presentar nuevamente la documentación en el Depto. de Alumnos.",
			"url":"http://gestiononline.unm.edu.ar/unm3w/acceso"
		},
		{
			"id": 19,
			"nombre": "DATOS",
			"descripcion":"Siempre que te comuniques por este medio deberás consignar todos tus datos para que podamos realizar las gestiones necesarias en el sistema.\n\nNombre y Apellido:\nDNI:\nCarrera:\nCorreo Electrónico:\nConsulta:\nCon esos datos podremos verificar la situación académica, y dar respuesta o enviar lo solicitado si así correspondiera.",
			"url":"http://gestiononline.unm.edu.ar/unm3w/acceso"
		},
		{
			"id": 20,
			"nombre": "CONSULTAS AL DEPARTAMENTO",
			"descripcion":"Deberá realizar su consulta al departamento de su carrera.\n\n\nDEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS\ndceyj@unm.edu.ar\nDEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA\ndcayt@unm.edu.ar\nDEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES\ndhycs@unm.edu.ar"
		},
		{
			"id": 21,
			"nombre": "RECEPCION DE DOCUMENTACION",
			"descripcion":"Su documentación fue recibida y cargada correctamente."
		},
		{
			"id": 22,
			"nombre": "CONSULTA A ITUNM",
			"descripcion":"Debe realizar su consulta a itunm@unm.edu.ar."
		},
		{
			"id": 23,
			"nombre": "CONSULTA A COPRUN",
			"descripcion":"Debe realizar su consulta a coprun@unm.edu.ar."
		},
		{
			"id": 24,
			"nombre": "INSCRIPCIONES DE VERANO",
			"descripcion":"Acerca de la oferta de asignaturas del período estival y de los requisitos para inscribirse deberá comunicarse con el departamento de su carrera.\nDEPARTAMENTO DE CIENCIAS ECONÓMICAS Y JURÍDICAS\ndceyj@unm.edu.ar\nDEPARTAMENTO DE CIENCIAS APLICADAS Y TECNOLOGÍA\ndcayt@unm.edu.ar\nDEPARTAMENTO DE HUMANIDADES Y CIENCIAS SOCIALES\ndhycs@unm.edu.ar"
		},
		{
			"id": 25,
			"nombre": "BAJA BOLETO ESTUDIANTIL",
			"descripcion":"Para realizar la baja del boleto estudiantil en nuestra institución debe ingresar en el siguiente enlace:",
			"url":"https://denuncias-bes.transporte.gba.gob.ar/denunciasboleto.php"
		},
		{
			"id": 26,
			"nombre": "CERTIFICADOS DE EXAMEN",
			"descripcion":"A través del siguiente enlace podrás descargar el modelo de Certificado de Examen.\nRecordá que dicho certificado tenés que presentarlo en el Departamento de Alumnos con firma y aclaración del docente para que pueda ser certificado(*).\nLas constancias de certifican en el Departamento de Alumnos de lunes a viernes de 9 a 19hs.\n(*)Las prácticas de las asignaturas TALLER  de la carrera Licenciatura Trabajo Social se certifican en el Departamento de Humanidades y Ciencias Sociales.",
			"url":"https://drive.google.com/file/d/1SGe8080Igdsz7QeH_o-Twjtblmdtj-8t/view?usp=drive_link"
		},
		{
			"id": 27,
			"nombre": "CONSTANCIA DE ALUMNO REGULAR ESPECIFICA",
			"descripcion":"Podés solicitar certificados de alumno regular con días y horarios de cursada en el Departamento de Alumnos.\nPara solicitar constancias de Alumno Regular específicas donde se indican días y horarios de cursada de cada una de sus asignaturas, podrá descargar el siguiente formulario y presentarlo completo personalmente en el Departamento de Alumnos.",
			"url":"https://drive.google.com/file/d/1Cw_rbcdV6SSKdGlH4GLlX1IzNGah1KZv/view?usp=drive_link"
		},
		{
			"id": 28,
			"nombre": "CAMBIO O SIMULTANEIDAD DE CARRERA",
			"descripcion":"Para solicitar un cambio o simultaneidad* de carrera tenés que completar el siguiente formulario virtual para dejar registro de la solicitud que querés realizar:\n* Para poder solicitar simultaneidad de carreras tenés que contar con un 25% de las asignaturas aprobadas de la carrera en la que te encontrás previamente inscripto.\nEl trámite de cambio/simultaneidad de carrera lo puede realizar desde el 29/09/2025 al 20/11/2025.",
			"url":"https://forms.gle/J72NmuPYeRhfKpxKA"
		},
		{
			"id": 29,
			"nombre": "INSCRIPCION PARA EGRESADOS",
			"descripcion":"Para solicitar la reinscripción a una nueva carrera tenés que completar el siguiente formulario virtual para dejar registro de la solicitud que querés realizar:\n*Al momento de completar el formulario deberás seleccionar dentro de SITUACIÓN ACADÉMICA la opción EGRESADO UNM.\nEl trámite de reinscripción a una nueva carrera lo podés realizar desde el 29/09/2025 al 20/11/2025.",
			"url":"https://forms.gle/J72NmuPYeRhfKpxKA"
		},
		{
			"id": 30,
			"nombre": "INSCRIPCION PARA RECHAZADOS (COPRUN APROBADO)",
			"descripcion":"Para solicitar la reinscripción a una carrera tenés que completar el siguiente formulario virtual para dejar registro de la solicitud que querés realizar:\n*Al momento de completar el formulario deberás seleccionar dentro de SITUACIÓN ACADÉMICA la opción COPRUN APROBADO Y QUIERO REINSCRIBIRME.\nEl trámite de reinscripción lo podés realizar desde el 29/09/2025 al 20/11/2025.",
			"url":"https://forms.gle/J72NmuPYeRhfKpxKA"
		},
		{
			"id": 31,
			"nombre": "INSCRIPCION CICLO LECTIVO 2026",
			"descripcion":"A partir del 29 de septiembre hasta el 31 de octubre podrás comenzar el proceso de inscripción para comenzar a cursar en el ciclo lectivo 2026.\n Para comenzar a inscribirte deberás completar un formulario a través de nuestro sitio web y luego validar la documentación el día que seleccionaste en el formulario en la opción solicitar turno.\n En el espacio de documentación dentro del formulario tendrás que subir: \nuna foto tuya como la que figura en el documento;\nfoto de frente y dorso del DNI;\nimagen o archivo pdf de la documentación que tengas de tus estudios del nivel secundario (constancia de alumno regular, constancia de finalización adeudando asignaturas, constancia de título en trámite o Certificado Analítico).\n *No aplica este último ítem para ingresantes por artículo 7 de la Ley de Educación Superior\n*Al momento de completar el formulario vas a estar realizando la preinscripción al Curso de Orientación y Preparación Universitaria (COPRUN) cuyo dictado comenzará el día 2 de febrero en el horario que seleccionaste en el formulario.\nSi no validás tu inscripción personalmente antes del 31 de octubre presentando los originales de la documentación subida en el formulario tu inscripción NO habrá finalizado.",
			"url":"https://www.unm.edu.ar/index.php/ingresantes/proceso-de-inscripcion-y-validacion-de-documentacion"
		}
	]
};
// Detectar tema del sistema operativo
function useSystemTheme() {
  const [theme, setTheme] = useState(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return theme;
}

const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function App() {
  // Estado para modal de Internos
  const [internosModalOpen, setInternosModalOpen] = useState(false);
  // Estado y lógica para Internos
  const [internosData, setInternosData] = useState([]);
  const [internosLoading, setInternosLoading] = useState(false);
  const [internosError, setInternosError] = useState(null);
  const [internosFiltro, setInternosFiltro] = useState("");
  const [internosFiltrados, setInternosFiltrados] = useState([]);

  useEffect(() => {
    if (internosModalOpen) {
      setInternosLoading(true);
      setInternosError(null);
      fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/internos.json')
        .then(res => res.json())
        .then(data => {
          setInternosData(data);
          setInternosFiltrados(data);
          setInternosLoading(false);
        })
        .catch(() => {
          setInternosError('No se pudo cargar el listado de internos');
          setInternosLoading(false);
        });
    } else {
      setInternosFiltro("");
      setInternosFiltrados([]);
    }
  }, [internosModalOpen]);

  // Función para quitar tildes/acentos
  function quitarTildes(str) {
    return str ? str.normalize('NFD').replace(/[ -\u007f-\u009f\u0300-\u036f]/g, '').toLowerCase() : '';
  }
  useEffect(() => {
    if (!internosFiltro) {
      setInternosFiltrados(internosData);
    } else {
      const filtro = quitarTildes(internosFiltro);
      setInternosFiltrados(
        internosData.filter(
          i => (i.area && quitarTildes(i.area).includes(filtro)) || (i.usuario && quitarTildes(i.usuario).includes(filtro))
        )
      );
    }
  }, [internosFiltro, internosData]);
  // Modal formularios
  // Estado para modal de exámenes finales
  const [examenesModalOpen, setExamenesModalOpen] = useState(false);
  const [formulariosOpen, setFormulariosOpen] = useState(false);
  const [formularios, setFormularios] = useState([]);
  const [formulariosLoading, setFormulariosLoading] = useState(false);
  const [formulariosError, setFormulariosError] = useState(null);
  // Modal tramites
  const [tramitesOpen, setTramitesOpen] = useState(false);
  const [tramites, setTramites] = useState([]);
  const [tramitesLoading, setTramitesLoading] = useState(false);
  const [tramitesError, setTramitesError] = useState(null);
  // Estado principal
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [selectedDate, setSelectedDate] = useState(null);
  const [activities, setActivities] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [year] = useState(2025);
  // Estado para modal de grillas
  const [grillasModalOpen, setGrillasModalOpen] = useState(false);
  const [grillasModalData, setGrillasModalData] = useState([]);
  const [grillasModalLoading, setGrillasModalLoading] = useState(false);
  const [grillasModalError, setGrillasModalError] = useState(null);
  // Plantillas (antes 'Consultas')
  const [plantillasOpen, setPlantillasOpen] = useState(false);
  const [plantillasData, setPlantillasData] = useState(null);
  const [plantillasLoading, setPlantillasLoading] = useState(false);
  const [plantillasError, setPlantillasError] = useState(null);
  const [plantillaSelected, setPlantillaSelected] = useState(null);
  const [plantillaCopyFeedback, setPlantillaCopyFeedback] = useState('');
  const [bubbleMaxWidth, setBubbleMaxWidth] = useState(null);
  const containerRef = useRef(null);
  const [plantillasRemoteFailed, setPlantillasRemoteFailed] = useState(false);
  useEffect(() => {
    function compute() {
      // Prefer a viewport-based max width so long descriptions (p.ej. equivalencias)
      // can use most of the screen when needed. Cap to avoid extremely wide boxes.
      const vw95 = Math.floor(window.innerWidth * 0.95);
      const capped = Math.min(Math.max(vw95, 700), 1800); // min 700px, max 1800px
      setBubbleMaxWidth(capped + 'px');
    }
    if (plantillasOpen) {
      compute();
      window.addEventListener('resize', compute);
      return () => window.removeEventListener('resize', compute);
    }
  }, [plantillasOpen]);
  // Estado de usuario autenticado
  const [user, setUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  // Estado para historial de actividades
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Estado y lógica para Auxiliares estudiantes
  const [auxiliaresModalOpen, setAuxiliaresModalOpen] = useState(false);
  const [auxiliaresData, setAuxiliaresData] = useState(null);
  const [auxiliaresLoading, setAuxiliaresLoading] = useState(false);
  const [auxiliaresError, setAuxiliaresError] = useState(null);
  const [auxiliaresDni, setAuxiliaresDni] = useState('');
  const [auxiliaresResult, setAuxiliaresResult] = useState(null);
  const [auxiliaresAccordionOpen, setAuxiliaresAccordionOpen] = useState([]);

  useEffect(() => {
    if (auxiliaresModalOpen && !auxiliaresData && !auxiliaresLoading) {
      setAuxiliaresLoading(true);
      fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/reportes_unm_auxiliares.json')
        .then(res => res.json())
        .then(data => {
          setAuxiliaresData(data);
          setAuxiliaresLoading(false);
        })
        .catch(() => {
          setAuxiliaresError('No se pudo cargar el reporte de auxiliares');
          setAuxiliaresLoading(false);
        });
    }
    if (!auxiliaresModalOpen) {
      setAuxiliaresDni('');
      setAuxiliaresResult(null);
      setAuxiliaresError(null);
    }
  }, [auxiliaresModalOpen]);

  function handleBuscarAuxiliar(e) {
    e.preventDefault();
    setAuxiliaresError(null);
    setAuxiliaresResult(null);
    setAuxiliaresAccordionOpen([]); // cerrar todos los accordions
    if (!auxiliaresData) return;
    const dni = auxiliaresDni.trim();
    if (!dni) return;
    // Buscar solo con cant_aprobadas_final > 0
    const found = auxiliaresData.filter(
      p => String(p.nro_documento) === dni && Number(p.cant_aprobadas_final) > 0
    );
    if (found.length === 0) {
      setAuxiliaresError('No se encontró ningún auxiliar con ese DNI y materias aprobadas.');
    } else {
      setAuxiliaresResult(found);
    }
  }
  const theme = useSystemTheme();
  // Componente helper para títulos de modales que respetan el tema del sistema
  const ModalTitle = ({ children, size = 22, inlineStyle = {} }) => (
    <h2 style={{
      fontSize: size,
      marginBottom: size === 18 ? 0 : 14,
      margin: inlineStyle.margin !== undefined ? inlineStyle.margin : (size === 18 ? 0 : 14),
      color: theme === 'dark' ? '#ffffff' : '#1976d2',
      textAlign: inlineStyle.textAlign || 'center',
      whiteSpace: inlineStyle.whiteSpace || 'normal',
      flex: inlineStyle.flex || undefined,
      ...inlineStyle
    }}>{children}</h2>
  );
  // Helpers para calendario
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
  }
  function getFirstDayOfWeek(month, year) {
    return new Date(year, month, 1).getDay();
  }
  function handlePrevMonth() {
    setMonth(m => (m === 0 ? 11 : m - 1));
    setSelectedDate(null);
  }
  function handleNextMonth() {
    setMonth(m => (m === 11 ? 0 : m + 1));
    setSelectedDate(null);
  }
  function handleDayClick(day) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  }
  // Actividades del día seleccionado (comparar con formato yyyy-mm-dd)
  const activitiesForDate = selectedDate
    ? activities.filter(a => {
        // selectedDate es yyyy-mm-dd, a.date es yyyy-mm-dd
        // Si a.date viene en dd/mm/yyyy, convertir a yyyy-mm-dd
        let actDate = a.date;
        if (actDate && actDate.includes('/')) {
          const [d, m, y] = actDate.split('/');
          actDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        return actDate === selectedDate;
      })
    : [];
  // Formulario para agregar actividad (debajo del calendario)
  const [form, setForm] = useState({ title: '', description: '', to: '', periodo: false });
  async function handleAddActivity(e) {
    e.preventDefault();
    if (!user) {
      alert('Inicia sesión para agregar actividades');
      return;
    }
    if (!form.title || !selectedDate) return;
    const fromDate = new Date(selectedDate);
    if (form.periodo && form.to) {
      const toDate = new Date(form.to);
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const fechaISO = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        await fetch(`${API}activities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            titulo: form.title,
            descripcion: form.description,
            fecha_inicio: fechaISO,
            fecha_fin: null
          })
        });
      }
    } else {
      const [a, m, d] = selectedDate.split('-');
      const fechaISO = `${a}-${m}-${d}`;
      await fetch(`${API}activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          titulo: form.title,
          descripcion: form.description,
          fecha_inicio: fechaISO,
          fecha_fin: null
        })
      });
    }
    setForm({ title: '', description: '', to: '', periodo: false });
    await fetchActivities(); // Recargar actividades después de agregar
  }
  // Login
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch(`${API}login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (!res.ok) throw new Error('Credenciales incorrectas');
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data)); // Guardar sesión
      setLoginForm({ username: '', password: '' });
    } catch (err) {
      setLoginError('Usuario o contraseña incorrectos');
    }
  }
  function handleLogout() {
    setUser(null);
    localStorage.removeItem('user'); // Limpiar sesión
  }
  // Restaurar usuario desde localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  // Cargar actividades desde la base de datos al iniciar
  useEffect(() => {
    fetchActivities();
  }, []);
  // Eliminar actividad (admin o usuario dueño)
  async function handleDeleteActivity(id) {
    if (!user) return;
    const url = `${API}activities/${id}?userId=${encodeURIComponent(user.id)}`;
    console.log('DELETE url:', url, 'user.id:', user.id, 'typeof:', typeof user.id);
    const res = await fetch(url, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const text = await res.text();
      alert('Error al eliminar: ' + text);
    }
    await fetchActivities();
    setEditingId(null);
  }
  // Editar actividad con historial
  async function handleSaveEditActivity(id, date) {
    if (!user) return;
    // Llamar al endpoint de edición (debe implementarse en backend)
    await fetch(`${API}activities/${id}/edit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        titulo: editForm.title,
        descripcion: editForm.description,
        fecha_inicio: date.split('/').reverse().join('-')
      })
    });
    setEditingId(null);
    await fetchActivities(); // Recargar actividades después de editar
  }
  // Cargar actividades desde la base de datos
  async function fetchActivities() {
    try {
      const res = await fetch(`${API}activities`);
      const data = await res.json();
      const acts = data.map(a => ({
        id: a.id,
        title: a.titulo,
        description: a.descripcion,
        date: a.fecha_inicio ? a.fecha_inicio.slice(0, 10) : '', // yyyy-mm-dd
        user_id: a.user_id,
        username: a.username
      }));
      setActivities(acts);
    } catch {
      setActivities([]);
    }
  }
  // Render
  // Construir matriz de semanas para el mes (antes de renderizar JSX)
  const daysInMonth = getDaysInMonth(month, year);
  const firstDay = getFirstDayOfWeek(month, year);
  const weeks = [];
  let week = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row', height: '93vh', minHeight: 500, minWidth: '98vw', background: theme === 'dark' ? '#181a1b' : '#f7f7f7', color: theme === 'dark' ? '#f7f7f7' : '#222', overflow: 'hidden' }}>
      {/* Login arriba a la derecha */}
      <div style={{ position: 'fixed', top: 10, right: 20, zIndex: 2000 }}>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 600, color: '#1976d2' }}>{user.username} ({user.id})</span>
            <button onClick={handleLogout} style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Salir</button>
          </div>
        ) : (
          <>
            <button onClick={() => setLoginModalOpen(true)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 1px 6px #0002' }}>Iniciar sesión</button>
            <Modal open={loginModalOpen} onClose={() => setLoginModalOpen(false)}>
              <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
                <ModalTitle inlineStyle={{ textAlign: 'center' }}>Iniciar sesión</ModalTitle>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  setLoginError(null);
                  try {
                    const res = await fetch(`${API}login`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(loginForm)
                    });
                    if (!res.ok) throw new Error('Credenciales incorrectas');
                    const data = await res.json();
                    setUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    setLoginForm({ username: '', password: '' });
                    setLoginModalOpen(false);
                  } catch (err) {
                    setLoginError('Usuario o contraseña incorrectos');
                  }
                }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Usuario"
                    value={loginForm.username}
                    onChange={e => setLoginForm(f => ({ ...f, username: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 14 }}
                    required
                    autoFocus
                  />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={loginForm.password}
                    onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                    style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 14 }}
                    required
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <button type="submit" style={{ padding: '8px 14px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Ingresar</button>
                    <button type="button" onClick={() => setLoginModalOpen(false)} style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #bbb', background: '#fff', color: '#222', cursor: 'pointer' }}>Cancelar</button>
                  </div>
                  {loginError && <div style={{ color: 'red', fontSize: 13, marginTop: 4, textAlign: 'center' }}>{loginError}</div>}
                </form>
              </div>
            </Modal>
          </>
        )}
      </div>
      {/* Calendario y form */}
      <div style={{ width: 500, minWidth: 380, maxWidth: 650, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', height: '100%' }}>
        {/* Bloque calendario con altura fija */}
        <div style={{ width: '100%', maxWidth: 480, height: 340, background: theme === 'dark' ? '#181a1b' : '#f7f7f7', borderRadius: 16, boxShadow: theme === 'dark' ? '0 2px 12px #0006' : '0 2px 12px #0001', padding: '8px 0 10px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', marginBottom: 18 }}>
        <h2 style={{ textAlign: 'center', fontSize: 22, marginBottom: 8 }}>Calendario {year}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6, gap: 8 }}>
            <button onClick={handlePrevMonth} style={{ padding: '4px 10px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc', background: theme === 'dark' ? '#23272f' : '#f5f5f5', color: theme === 'dark' ? '#f7f7f7' : '#222', cursor: 'pointer', width: 120 }}>
              &lt; {months[(month + 11) % 12]}
            </button>
            <h3 style={{ margin: 0, minWidth: 120, textAlign: 'center', fontWeight: 700, fontSize: 18, width: 120 }}>{months[month]}</h3>
            <button onClick={handleNextMonth} style={{ padding: '4px 10px', fontSize: 15, borderRadius: 6, border: '1px solid #ccc', background: theme === 'dark' ? '#23272f' : '#f5f5f5', color: theme === 'dark' ? '#f7f7f7' : '#222', cursor: 'pointer', width: 120 }}>
              {months[(month + 1) % 12]} &gt;
            </button>
          </div>
          {/* calendar table */}
          <table style={{ width: '100%', maxWidth: 320, margin: 'auto', borderCollapse: 'collapse', background: theme === 'dark' ? '#23272f' : '#fff', fontSize: 15, color: theme === 'dark' ? '#f7f7f7' : '#222', boxShadow: theme === 'dark' ? '0 1px 8px #0008' : '0 1px 8px #0001' }}>
            <thead>
              <tr>
                {weekDays.map(wd => (
                  <th key={wd} style={{ padding: 2, borderBottom: '1px solid #ccc', color: '#1976d2', fontSize: 13 }}>{wd}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, wIdx) => (
                <tr key={wIdx}>
                  {week.map((day, dIdx) => {
                    if (!day) return <td key={dIdx} style={{ height: 40 }} />;
                    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;
                    const actsCount = activities.filter(a => a.date === dateStr).length;
                    return (
                      <td key={dIdx}
                        style={{
                          padding: 0,
                          border: `1px solid ${theme === 'dark' ? '#444' : '#ccc'}`,
                          background: isSelected
                            ? '#1083f7ff'
                            : (theme === 'dark' ? '#23272f' : '#fff'),
                          color: isSelected ? '#fff' : (theme === 'dark' ? '#f7f7f7' : '#333'),
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'background 0.2s, color 0.2s',
                          position: 'relative',
                          height: 32,
                          width: 40,
                          verticalAlign: 'middle'
                        }}
                      >
                        {/* Badge arriba del cuadrante, no sobre el número */}
                        {actsCount > 0 && (
                          <span style={{ position: 'absolute', top: 1, right: 1, background: '#10467cff', color: '#fff', borderRadius: 7, fontSize: 10, minWidth: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 1px 4px #0002', zIndex: 2, padding: '0 4px' }}>
                            {actsCount}
                          </span>
                        )}
                        <button
                          style={{ width: 55, height: 35, border: 'none', background: 'transparent', color: 'inherit', fontWeight: 'inherit', cursor: 'pointer', fontSize: 14, outline: 'none', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 0, margin: 'auto' }}
                          onClick={() => handleDayClick(day)}
                          tabIndex={0}
                        >
                          {day}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Bloque form con altura fija */}
        <div style={{ width: '100%', maxWidth: 500, height: 230, background: theme === 'dark' ? '#23272f' : '#fff', borderRadius: 8, boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #0001', border: '1px solid #ddd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', overflowY: 'auto' }}>
          <form onSubmit={handleAddActivity} style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6, width: '95%' }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: theme === 'dark' ? '#f7f7f7' : '#1976d2' }}>Agregar actividad</div>
            <input
              name="title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Título"
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13 }}
              required
              disabled={!selectedDate || !user}
            />
            <textarea
              name="description"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción"
              style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13, minHeight: 40 }}
              disabled={!selectedDate || !user}
            />
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2, justifyContent: 'center', width: '100%' }}>
              <input
                type="date"
                name="from"
                value={selectedDate || ''}
                onChange={e => setSelectedDate(e.target.value)}
                style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 12, width: 140, minWidth: 70, maxWidth: 180, textAlign: 'center', margin: '0 auto' }}
                disabled={!selectedDate || !user}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.periodo}
                  onChange={e => setForm(f => ({ ...f, periodo: e.target.checked }))}
                  style={{ marginRight: 2, marginLeft: 2 }}
                  disabled={!selectedDate || !user}
                />
                <span style={{ fontSize: 12, fontWeight: 400, marginRight: 3 }}>Periodo</span>
                <input
                  type="date"
                  name="to"
                  value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #bbb', fontSize: 12, width: 140, minWidth: 70, maxWidth: 180, textAlign: 'center', margin: '0 auto' }}
                  min={selectedDate}
                  required={form.periodo}
                  disabled={!form.periodo || !selectedDate || !user}
                />
              </div>
            </div>
            <button type="submit" style={{ padding: '6px 0', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 14, cursor: selectedDate && user ? 'pointer' : 'not-allowed', marginTop: 6 }} disabled={!selectedDate || !user}>Agregar</button>
          </form>
        </div>
      </div>
      {/* Panel lateral de actividades */}
      <div style={{ flex: 1, minWidth: 220, padding: 20, borderLeft: theme === 'dark' ? '1px solid #333' : '1px solid #ccc', background: theme === 'dark' ? '#181a1b' : '#fafbfc', color: theme === 'dark' ? '#f7f7f7' : '#222', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#222', fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Novedades del día</h2>
        {selectedDate ? (
          <>
            {/* Mostrar fecha seleccionada con día de la semana y formato dd/mm/yyyy */}
            <div style={{ fontSize: 17, fontWeight: 500, marginBottom: 8, color: theme === 'dark' ? '#f7f7f7' : '#1976d2', backgroundColor: theme === 'dark' ? '#1976d2' : '#e3f2fd', padding: '8px 12px', borderRadius: 6 }}>
              {(() => {
                if (!selectedDate) return '';
                const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const [a, m, d] = selectedDate.split('-').map(Number);
                const fecha = new Date(a, m - 1, d);
                const diaSemana = diasSemana[fecha.getDay()];
                return `${diaSemana} ${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}/${a}`;
              })()}
            </div>
            {/* Mostrar actividades */}
            {activitiesForDate.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'left' }}>
                {activitiesForDate.map(act => (
                  <AccordionItem
                    key={act.id}
                    act={act}
                    theme={theme}
                    editingId={editingId}
                    editForm={editForm}
                    handleStartEdit={a => {
                      setEditingId(a.id);
                      setEditForm({ title: a.title, description: a.description });
                    }}
                    handleDeleteActivity={handleDeleteActivity}
                    handleCancelEdit={() => setEditingId(null)}
                    handleSaveEdit={(id, date) => {
                      setActivities(acts => acts.map(a => a.id === id ? { ...a, title: editForm.title, description: editForm.description, date } : a));
                      setEditingId(null);
                    }}
                    setEditForm={setEditForm}
                    selectedDate={selectedDate ? selectedDate.split('-').reverse().join('/') : ''}
                    activities={activities}
                    user={user}
                    handleSaveEditActivity={handleSaveEditActivity}
                    handleShowHistory={async (id) => {
                      setHistoryModalOpen(true);
                      setHistoryLoading(true);
                      setHistoryError(null);
                      try {
                        const res = await fetch(`${API}activities/${id}/history`);
                        if (!res.ok) throw new Error('Error al obtener historial');
                        const data = await res.json();
                        setHistoryData(data);
                      } catch {
                        setHistoryError('No se pudo obtener el historial');
                      }
                      setHistoryLoading(false);
                    }}
                  />
                ))}
              </ul>
            ) : (
              <p>No hay actividades para este día.</p>
            )}
          </>
        ) : (
          <p>Selecciona un día para ver actividades.</p>
        )}
      </div>
      {/* Panel de accesos directos */}
      <div style={{ flex: 1, minWidth: 220, padding: 20, borderLeft: theme === 'dark' ? '1px solid #333' : '1px solid #ccc', background: theme === 'dark' ? '#181a1b' : '#fff', color: theme === 'dark' ? '#fff' : '#222', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#222', fontSize: 24, fontWeight: 700, marginBottom: 24, marginTop: 10, letterSpacing: 1 }}>Accesos directos</h2>
        {/* Estado para modal de exámenes finales */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: 'center',
            marginTop: 10,
            maxWidth: '100vw',
            minWidth: 320,
            boxSizing: 'border-box',
            maxHeight: 'calc(100vh - 180px)', // deja espacio para el header y paddings
            overflowY: 'auto',
          }}
        >
          {[
            { label: 'Trámites', onClick: () => {
                setTramitesOpen(true);
                setTramitesLoading(true);
                setTramitesError(null);
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    // Buscar el array tramites dentro del objeto
                    let arr = [];
                    if (data && typeof data === 'object' && Array.isArray(data.tramites)) {
                      arr = data.tramites;
                    }
                    logTramites(arr); // TEMP: ver estructura de cada trámite
                    setTramites(arr);
                    setTramitesLoading(false);
                  })
                  .catch(() => {
                    setTramitesError('No se pudieron cargar los trámites');
                    setTramitesLoading(false);
                  });
              }
            },
            { label: 'Formularios', onClick: () => {
                setFormulariosOpen(true);
                setFormulariosLoading(true);
                setFormulariosError(null);
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    setFormularios(data);
                    setFormulariosLoading(false);
                  })
                  .catch(() => {
                    setFormulariosError('No se pudieron cargar los formularios');
                    setFormulariosLoading(false);
                  });
              }
            },
            { label: 'Plantillas', onClick: () => {
                setPlantillasOpen(true);
                setPlantillasLoading(true);
                setPlantillasError(null);
                // Si ya falló la descarga remota previamente, no reintentar (evita 404 repetidos)
                if (plantillasRemoteFailed) {
                  setPlantillasData(PLANTILLAS_FALLBACK);
                  setPlantillasLoading(false);
                } else {
                  // Intentar fetch remoto; si falla usar fallback y marcar fallo remoto
                  fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/consultas.json')
                    .then(res => {
                      if (!res.ok) {
                        setPlantillasRemoteFailed(true);
                        throw new Error('No remote');
                      }
                      return res.json();
                    })
                    .then(data => {
                      setPlantillasData(data);
                      setPlantillasLoading(false);
                    })
                    .catch(() => {
                      // usar fallback silenciosamente
                      setPlantillasData(PLANTILLAS_FALLBACK);
                      setPlantillasLoading(false);
                    });
                }
              }
            },
            { label: 'Internos', onClick: () => setInternosModalOpen(true) },
            {
              label: 'Grillas de cursada',
              onClick: () => {
                setGrillasModalOpen(true);
                setGrillasModalLoading(true);
                setGrillasModalError(null);
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    if (data && typeof data === 'object' && Array.isArray(data.bedelia)) {
                      const grillas = data.bedelia.filter(b => b.nombre && b.nombre.toLowerCase().includes('grilla') && b.url);
                      setGrillasModalData(grillas);
                    } else {
                      setGrillasModalError('No se encontró información de Grillas.');
                    }
                    setGrillasModalLoading(false);
                  })
                  .catch(() => {
                    setGrillasModalError('No se pudo obtener la información de Grillas.');
                    setGrillasModalLoading(false);
                  });
              }
            },
            {
              label: 'Bedelía',
              onClick: () => {
                fetch('https://raw.githubusercontent.com/matnasama/buscador-de-aulas/refs/heads/main/public/json/info/formularios.json')
                  .then(res => res.json())
                  .then(data => {
                    if (data && typeof data === 'object' && Array.isArray(data.bedelia)) {
                      const obj = data.bedelia.find(b => b.nombre && b.nombre.toLowerCase() === 'aulas' && b.url);
                      if (obj && obj.url) {
                        setTimeout(() => window.open(obj.url, '_blank'), 0);
                      } else {
                        alert('No se encontró el enlace de aulas de Bedelía.');
                      }
                    } else {
                      alert('No se encontró información de Bedelía.');
                    }
                  })
                  .catch(() => {
                    alert('No se pudo obtener la información de Bedelía.');
                  });
              }
            },
            { label: 'STIC' },
            { label: 'Auxiliares estudiantes', onClick: () => setAuxiliaresModalOpen(true) },
// ...antes del return principal, junto a los otros modales...
/* Modal Auxiliares estudiantes */
// (Colocar esto junto a los otros modales, fuera del array de cards)
// <Modal open={auxiliaresModalOpen} onClose={() => setAuxiliaresModalOpen(false)}>
//   <h2 style={{ fontSize: 22, marginBottom: 14, color: '#1976d2', textAlign: 'center' }}>Auxiliares estudiantes</h2>
//   <form onSubmit={handleBuscarAuxiliar} style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginBottom: 18 }}>
//     <input
//       type="text"
//       placeholder="Buscar por DNI"
//       value={auxiliaresDni}
//       onChange={e => setAuxiliaresDni(e.target.value.replace(/[^0-9]/g, ''))}
//       style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #bbb', fontSize: 15, width: 180, textAlign: 'center' }}
//       maxLength={12}
//       required
//       autoFocus
//       disabled={auxiliaresLoading}
//     />
//     <button type="submit" style={{ padding: '6px 18px', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 15, cursor: auxiliaresLoading ? 'not-allowed' : 'pointer' }} disabled={auxiliaresLoading}>Buscar</button>
//   </form>
//   {auxiliaresLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
//   {auxiliaresError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{auxiliaresError}</div>}
//   {auxiliaresResult && auxiliaresResult.length > 0 && (
//     <div style={{ margin: '0 auto', maxWidth: 500, background: '#e3f2fd', borderRadius: 12, padding: 18, border: '1.5px solid #1976d2', boxShadow: '0 1px 4px #1976d233' }}>
//       {auxiliaresResult.map((aux, idx) => (
//         <div key={aux.documento + '-' + idx} style={{ marginBottom: 18 }}>
//           <div style={{ fontWeight: 700, fontSize: 18, color: '#1976d2', marginBottom: 6 }}>{aux.nombre || 'Sin nombre'}</div>
//           <div style={{ fontSize: 15, color: '#333', marginBottom: 4 }}><b>DNI:</b> {aux.documento}</div>
//           <div style={{ fontSize: 15, color: '#333', marginBottom: 4 }}><b>Carrera:</b> {aux.carrera || 'Sin carrera'}</div>
//           <div style={{ fontSize: 15, color: '#333', marginBottom: 4 }}><b>Materias aprobadas:</b> {aux.cant_aprobadas_final}</div>
//         </div>
//       ))}
//     </div>
//   )}
// </Modal>
            { label: 'Exámenes Finales', onClick: () => {
                setExamenesModalOpen(true);
              }
            }
          ].map(card => (
            <div
              key={typeof card.label === 'string' ? card.label : card.label?.props?.children || Math.random()}
              style={{
                flex: '1 1 120px',
                minWidth: 100,
                maxWidth: 150,
                width: '12vw',
                height: 62,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme === 'dark' ? 'linear-gradient(135deg, #1565c0 60%, #1976d2 100%)' : 'linear-gradient(135deg, #42a5f5 60%, #90caf9 100%)',
                color: theme === 'dark' ? '#fff' : '#0d2346',
                borderRadius: 20,
                boxShadow: theme === 'dark' ? '0 2px 12px #0008' : '0 2px 12px #1976d233',
                fontWeight: 600,
                fontSize: 14,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                border: 'none',
                userSelect: 'none',
                letterSpacing: 1,
                marginBottom: 0,
                padding: '0 8px',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
              tabIndex={0}
              onClick={card.onClick}
              onMouseOver={e => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)'
                  : 'linear-gradient(135deg, #1976d2 60%, #42a5f5 100%)';
                e.currentTarget.style.boxShadow = '0 4px 18px #1976d288';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = theme === 'dark'
                  ? 'linear-gradient(135deg, #1565c0 60%, #1976d2 100%)'
                  : 'linear-gradient(135deg, #42a5f5 60%, #90caf9 100%)';
                e.currentTarget.style.boxShadow = theme === 'dark'
                  ? '0 2px 12px #0008'
                  : '0 2px 12px #1976d233';
                e.currentTarget.style.color = theme === 'dark' ? '#fff' : '#0d2346';
              }}
            >
              <span style={{ width: '100%', textAlign: 'center', lineHeight: 1.2 }}>{typeof card.label === 'string' ? card.label : card.label}</span>
            </div>
          ))}
        </div>
        {/* Modal de exámenes finales */}
        {/* Modal Auxiliares estudiantes */}
        <Modal open={auxiliaresModalOpen} onClose={() => setAuxiliaresModalOpen(false)}>
          <form
            onSubmit={handleBuscarAuxiliar}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              justifyContent: 'center',
              width: '100%',
              maxWidth: 480,
              margin: '0 auto 18px auto',
              marginTop: 0,
              padding: 0,
              position: 'relative',
            }}
          >
              <ModalTitle size={18} inlineStyle={{ margin: 0, whiteSpace: 'nowrap', flex: '0 0 auto' }}>Auxiliares estudiantes</ModalTitle>
            <input
              type="text"
              placeholder="Buscar por DNI"
              value={auxiliaresDni}
              onChange={e => setAuxiliaresDni(e.target.value.replace(/[^0-9]/g, ''))}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #bbb', fontSize: 14, width: 140, textAlign: 'center', margin: 0, flex: '0 0 140px', minWidth: 0 }}
              maxLength={12}
              required
              autoFocus
              disabled={auxiliaresLoading}
            />
            <button
              type="submit"
              style={{ padding: '6px 0', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, fontSize: 14, cursor: auxiliaresLoading ? 'not-allowed' : 'pointer', margin: 0, flex: '0 0 70px', minWidth: 0, width: 70 }}
              disabled={auxiliaresLoading}
            >
              Buscar
            </button>
          </form>
          {auxiliaresLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {auxiliaresError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{auxiliaresError}</div>}
          {auxiliaresResult && auxiliaresResult.length > 0 && (
            <AccordionResultadosAuxiliares
              resultados={auxiliaresResult}
              accordionOpen={auxiliaresAccordionOpen}
              setAccordionOpen={setAuxiliaresAccordionOpen}
            />
          )}
        </Modal>
        {/* Modal de Internos */}
        <Modal open={internosModalOpen} onClose={() => setInternosModalOpen(false)}>
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 2,
              background: theme === 'dark' ? '#23272f' : '#fff',
              paddingBottom: 10,
              marginBottom: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              justifyContent: 'center',
              width: '100%',
              maxWidth: 480,
              margin: '0 auto 10px auto',
              minWidth: 0,
              flexWrap: 'nowrap',
              
            }}
          >
            <ModalTitle size={18} inlineStyle={{ margin: 0, whiteSpace: 'nowrap', flex: '0 0 auto' }}>Internos</ModalTitle>
            <input
              type="text"
              placeholder="Buscar por área o usuario"
              value={internosFiltro}
              onChange={e => setInternosFiltro(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #bbb', fontSize: 13, width: 180, textAlign: 'center', background: theme === 'dark' ? '#181a1b' : '#fff', color: theme === 'dark' ? '#fff' : '#222', margin: 0, flex: '0 0 160px', minWidth: 0 }}
              autoFocus
              disabled={internosLoading}
            />
          </div>
          <div
            style={{
              maxHeight: '65vh',
              overflowY: 'auto',
              paddingTop: 2,
              scrollbarWidth: 'thin',
              scrollbarColor: theme === 'dark' ? '#1976d2bb #23272f' : '#1976d2 #e3f2fd',
            }}
            className="scrollbar-internos"
          >
        {/* Estilos para la barra de scroll del listado de internos */}
        <style>{`
          .scrollbar-internos::-webkit-scrollbar {
            width: 8px;
            background: transparent;
          }
          .scrollbar-internos::-webkit-scrollbar-thumb {
            background: ${'${theme === "dark" ? "#1976d2bb" : "#1976d2"}'};
            border-radius: 6px;
            border: 2px solid ${'${theme === "dark" ? "#23272f" : "#e3f2fd"}'};
            min-height: 24px;
          }
          .scrollbar-internos::-webkit-scrollbar-thumb:hover {
            background: ${'${theme === "dark" ? "#42a5f5cc" : "#42a5f5"}'};
          }
          .scrollbar-internos::-webkit-scrollbar-track {
            background: transparent;
          }
        `}</style>
            {internosLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
            {internosError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{internosError}</div>}
            {!internosLoading && !internosError && internosFiltrados && internosFiltrados.length > 0 && (
              <table
                style={{
                  width: '100%',
                  maxWidth: 600,
                  margin: 'auto',
                  borderCollapse: 'collapse',
                  background: theme === 'dark' ? '#23272f' : '#e3f2fd',
                  borderRadius: 12,
                  boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #1976d233',
                  fontSize: 15,
                  color: theme === 'dark' ? '#fff' : '#222',
                }}
              >
                <thead>
                  <tr style={{ background: theme === 'dark' ? '#1976d2' : '#1976d2', color: '#fff' }}>
                    <th style={{ padding: 8, borderRadius: '12px 0 0 0' }}>Área</th>
                    <th style={{ padding: 8 }}>Usuario</th>
                    <th style={{ padding: 8, borderRadius: '0 12px 0 0' }}>Interno</th>
                  </tr>
                </thead>
                <tbody>
                  {internosFiltrados.map((i, idx) => (
                    <tr key={idx} style={{ background: theme === 'dark' ? (idx % 2 === 0 ? '#181a1b' : '#23272f') : (idx % 2 === 0 ? '#fff' : '#e3f2fd') }}>
                      <td style={{ padding: 8, color: theme === 'dark' ? '#fff' : '#222' }}>{i.area}</td>
                      <td style={{ padding: 8, color: theme === 'dark' ? '#fff' : '#222' }}>{i.usuario}</td>
                      <td style={{ padding: 8, color: theme === 'dark' ? '#fff' : '#222' }}>{i.interno}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!internosLoading && !internosError && internosFiltrados && internosFiltrados.length === 0 && (
              <div style={{ color: '#888', textAlign: 'center', margin: 18 }}>No se encontraron internos.</div>
            )}
          </div>
        </Modal>
        <Modal open={examenesModalOpen} onClose={() => setExamenesModalOpen(false)}>
          <ModalTitle>Exámenes Finales</ModalTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 600, margin: 'auto' }}>
            {/* Botón DCAYT */}
            <a
              href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=1276171040&single=true&urp=gmail_link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#42a5f5',
                borderRadius: 8,
                border: '2px solid #1976d2',
                padding: '22px 0',
                fontWeight: 'normal',
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                maxWidth: 420,
                minWidth: 220,
                marginBottom: 0,
                display: 'block',
                boxShadow: '0 2px 12px #1976d233',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                letterSpacing: 0.5,
                marginLeft: 'auto',
                marginRight: 'auto',
                textTransform: 'uppercase',
              }}
            >
              Departamento de Ciencias Aplicadas y Tecnología
            </a>
            {/* Botón DCEyJ */}
            <a
              href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=258106575&single=true&urp=gmail_link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#006400',
                borderRadius: 8,
                border: '2px solid #1976d2',
                padding: '22px 0',
                fontWeight: 'normal',
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                maxWidth: 420,
                minWidth: 220,
                marginBottom: 0,
                display: 'block',
                boxShadow: '0 2px 12px #1976d233',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                letterSpacing: 0.5,
                marginLeft: 'auto',
                marginRight: 'auto',
                textTransform: 'uppercase',
              }}
            >
              Departamento de Ciencias Económicas y Jurídicas
            </a>
            {/* Botón DHYCS */}
            <a
              href="https://docs.google.com/spreadsheets/u/2/d/e/2PACX-1vSSs7PbwGNijblVEd7VzY0YCgd4vAzAr8ZJtZMHAPtxkVFxYzRON50pBVhxvJwRzg/pubhtml?gid=1874348986&single=true&urp=gmail_link"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#f44336',
                borderRadius: 8,
                border: '2px solid #1976d2',
                padding: '22px 0',
                fontWeight: 'normal',
                fontSize: 18,
                color: '#fff',
                textAlign: 'center',
                textDecoration: 'none',
                width: '100%',
                maxWidth: 420,
                minWidth: 220,
                marginBottom: 0,
                display: 'block',
                boxShadow: '0 2px 12px #1976d233',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                letterSpacing: 0.5,
                marginLeft: 'auto',
                marginRight: 'auto',
                textTransform: 'uppercase',
              }}
            >
              Departamento de Humanidades y Ciencias Sociales
            </a>
          </div>
        </Modal>
        {/* Modal de formularios */}
        <Modal open={formulariosOpen} onClose={() => setFormulariosOpen(false)}>
          <ModalTitle inlineStyle={{ textAlign: 'center' }}>Formularios</ModalTitle>
          {formulariosLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {formulariosError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{formulariosError}</div>}
          {/* Soportar array directo o dentro de un objeto */}
          {!formulariosLoading && !formulariosError && (
            (() => {
              let arr = null;
              if (Array.isArray(formularios)) arr = formularios;
              else if (formularios && typeof formularios === 'object') {
                // Buscar la primera propiedad que sea un array
                const arrKey = Object.keys(formularios).find(k => Array.isArray(formularios[k]));
                if (arrKey) arr = formularios[arrKey];
              }
              if (arr && arr.length > 0) {
                // Filtrar formularios a excluir por coincidencia exacta de título (case-insensitive)
                const excluidos = [
                  'formulario de licencias',
                  'formulario alta de usuario',
                  'formulario alta sistemas de gestion'
                ];
                const visibles = arr.filter(f => {
                  if (!f.titulo) return true;
                  const t = f.titulo.trim().toLowerCase();
                  return !excluidos.includes(t);
                });
                return (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 20,
                    justifyItems: 'center',
                    alignItems: 'center',
                    width: '80%',
                    margin: '0 auto',
                    maxWidth: 1000
                  }}>
                    {visibles.map((f, idx) => (
                      <a
                        key={f.url || idx}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  height: 140, /* ligeramente más pequeña */
                                  minWidth: 0,
                                  width: '100%',
                                  maxWidth: 150, /* reducir ancho máximo */
                                  background: '#e3f2fd',
                                  color: '#000000ff',
                                  fontWeight: 500,
                                  fontSize: 13, /* reducir tamaño de fuente */
                                  textAlign: 'center',
                                  textDecoration: 'none',
                                  borderRadius: 10,
                                  boxShadow: '0 1px 4px #1976d233',
                                  border: '1.5px solid #1976d2',
                                  transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                                  cursor: 'pointer',
                                  letterSpacing: 0.4,
                                  padding: '8px 6px', /* menos padding */
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                }}
                      >
                        {(f.titulo || '').toUpperCase()}
                      </a>
                    ))}
                  </div>
                );
              } else if (formularios && !Array.isArray(formularios)) {
                return <div style={{ color: '#d32f2f', marginTop: 12 }}>El JSON recibido no contiene formularios para mostrar.</div>;
              } else {
                return null;
              }
            })()
          )}
        </Modal>
        {/* Modal de Plantillas (antes Consultas) */}
  <Modal open={plantillasOpen} onClose={() => { setPlantillasOpen(false); setPlantillaSelected(null); }} width={'75vw'} maxWidth={1200} minWidth={520}>
          <ModalTitle inlineStyle={{ textAlign: 'center' }}>Plantillas</ModalTitle>
          {plantillasLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando plantillas...</div>}
          {plantillasError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{plantillasError}</div>}
          {!plantillasLoading && !plantillasError && plantillasData && (
            (() => {
              // Normalizar plantillasData para soportar varios formatos:
              let items = [];
              try {
                if (!plantillasData) items = [];
                else if (Array.isArray(plantillasData)) items = plantillasData;
                else if (Array.isArray(plantillasData.consultas)) items = plantillasData.consultas;
                else if (plantillasData.consultas && typeof plantillasData.consultas === 'object') {
                  items = Object.keys(plantillasData.consultas).map(k => plantillasData.consultas[k]);
                } else {
                  const keys = Object.keys(plantillasData).filter(k => k !== 'meta' && k !== 'info');
                  if (keys.length > 0 && keys.every(k => plantillasData[k] && plantillasData[k].nombre)) {
                    items = keys.map(k => plantillasData[k]);
                  }
                }
              } catch (e) {
                items = [];
              }
              const byId = {};
              items.forEach(it => {
                if (!it) return;
                const id = it.id != null ? String(it.id) : (it.nombre || Math.random());
                if (!byId[id]) byId[id] = it;
              });
              items = Object.values(byId).filter(Boolean);
              items.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

              // Ahora el modal sólo renderiza los botones; al hacer click se abre una burbuja (tooltip/card)
              // Usaremos refs para posicionar la burbuja relativa al botón.
              const [bubble, setBubble] = [plantillaSelected, setPlantillaSelected];
              return (
                <div ref={containerRef} style={{ position: 'relative', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, maxHeight: '85vh', overflowY: 'auto', padding: 8 }}>
                    {items.map(it => {
                      const selected = plantillaSelected && plantillaSelected.id === it.id;
                      const bg = selected ? (theme === 'dark' ? '#1976d2' : '#1976d2') : (theme === 'dark' ? '#1e2936' : '#e3f2fd');
                      const color = selected ? '#fff' : (theme === 'dark' ? '#f7f7f7' : '#0d2346');
                      return (
                        <div key={it.id || it.nombre} style={{ position: 'relative' }}>
                          <button
                            onClick={() => {
                              // Seleccionar y mostrar burbuja centrada en el modal
                              setPlantillaSelected(it);
                            }}
                            title={it.nombre}
                            style={{ padding: '6px 8px', minHeight: 44, borderRadius: 8, border: '1px solid ' + (selected ? (theme === 'dark' ? '#0b3a66' : '#0b3a66') : '#1976d2'), background: bg, color, cursor: 'pointer', textAlign: 'left', fontSize: 11, overflow: 'visible', whiteSpace: 'normal', lineHeight: 1.2, boxShadow: selected ? '0 6px 20px rgba(25,118,210,0.28)' : 'none', width: '100%' }}>
                            {it.nombre}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {/* Burbuja centrada con overlay para cerrar al click fuera */}
                  {plantillaSelected && (
                    <>
                      <div
                        onClick={() => setPlantillaSelected(null)}
                        style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', zIndex: 1100, background: 'transparent'}}
                      />
                      <div
                        onClick={e => e.stopPropagation()}
                        style={{
                          position: 'fixed',
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 'auto',
                          maxWidth: bubbleMaxWidth || '920px',
                          zIndex: 1200
                        }}
                      >
                        <div style={{ background: theme === 'dark' ? '#1e2530' : '#fff', color: theme === 'dark' ? '#fff' : '#222', border: '1px solid #ddd', borderRadius: 10, padding: '14px 15px', boxShadow: '0 12px 36px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontWeight: 700, color: theme === 'dark' ? '#fff' : '#1976d2', textAlign: 'left', width: '100%' }}>{plantillaSelected.nombre}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={async () => {
                                  try {
                                    // Construir texto: descripción y enlaces (no incluir el título)
                                    let text = (plantillaSelected.descripcion || '').trim();
                                    if (plantillaSelected.url) {
                                      text += (text ? '\n\n' : '') + plantillaSelected.url;
                                    }
                                    // Soportar si hay más de un link (campo urls hipotético)
                                    if (plantillaSelected.urls && Array.isArray(plantillaSelected.urls)) {
                                      plantillaSelected.urls.forEach(u => { text += '\n' + u; });
                                    }
                                    await navigator.clipboard.writeText(text);
                                    setPlantillaCopyFeedback('Copiado');
                                    setTimeout(() => setPlantillaCopyFeedback(''), 1500);
                                  } catch (e) {
                                    setPlantillaCopyFeedback('Error');
                                    setTimeout(() => setPlantillaCopyFeedback(''), 1500);
                                  }
                                }}
                                title="Copiar descripción y enlaces"
                                style={{ border: 'none', background: '#1976d2', color: '#fff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}
                              >
                                {plantillaCopyFeedback || 'Copiar'}
                              </button>
                              <button onClick={() => setPlantillaSelected(null)} style={{ border: 'none', background: 'transparent', color: '#888', cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                          <div style={{ marginTop: 10, whiteSpace: 'pre-wrap', color: theme === 'dark' ? '#f1f1f1' : '#222', textAlign: 'left' }}>{plantillaSelected.descripcion}</div>
                          {plantillaSelected.url && (
                            <div style={{ marginTop: 10, textAlign: 'left' }}>
                              <a href={plantillaSelected.url} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>{plantillaSelected.url}</a>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })()
          )}
        </Modal>
        {/* Modal de trámites (layout fila, key robusta) */}
        <Modal open={tramitesOpen} onClose={() => setTramitesOpen(false)}>
          <ModalTitle>Trámites</ModalTitle>
          {tramitesLoading && <div style={{ textAlign: 'center', margin: 14 }}>Cargando...</div>}
          {tramitesError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 14 }}>{tramitesError}</div>}
          {!tramitesLoading && !tramitesError && tramites && tramites.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 600, margin: 'auto' }}>
              {tramites.map((t, idx) => (
                <div key={(t.titulo || t.nombre || 'tramite') + '-' + idx} style={{ background: '#e3f2fd', borderRadius: 12, border: '1.2px solid #1976d2', padding: '4px 8px', fontSize: 14, color: '#1976d2', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginRight: 18, flex: 1, textAlign: 'left', textTransform: 'uppercase' }}>{(t.titulo || t.nombre || 'Trámite')}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginLeft: 'auto' }}>
                    {t.formulario && (
                      <a href={t.formulario} target="_blank" rel="noopener noreferrer" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s' }}>Formulario</a>
                    )}
                    {t.hoja_de_calculo && (
                      <a href={t.hoja_de_calculo} target="_blank" rel="noopener noreferrer" style={{ background: '#fff', color: '#1976d2', border: '1.2px solid #1976d2', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 13, textDecoration: 'none', cursor: 'pointer', letterSpacing: 0.5, transition: 'background 0.2s, color 0.2s' }}>Ver trámite</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
        {/* Modal de grillas de cursada */}
        <Modal open={grillasModalOpen} onClose={() => setGrillasModalOpen(false)}>
          <ModalTitle>Grillas de cursada</ModalTitle>
          {grillasModalLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {grillasModalError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{grillasModalError}</div>}
          {!grillasModalLoading && !grillasModalError && grillasModalData && grillasModalData.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%', maxWidth: 600, margin: 'auto' }}>
              {grillasModalData.map((g, idx) => {
                let nombreDepto = '';
                let colorFondo = '';
                let colorTexto = '#fff';
                if (/dcayt/i.test(g.nombre)) {
                  nombreDepto = 'Departamento de Ciencias Aplicadas y Tecnología';
                  colorFondo = '#42a5f5';
                } else if (/dceyj/i.test(g.nombre)) {
                  nombreDepto = 'Departamento de Ciencias Económicas y Jurídicas';
                  colorFondo = '#006400';
                } else if (/dhycs/i.test(g.nombre)) {
                  nombreDepto = 'Departamento de Humanidades y Ciencias Sociales';
                  colorFondo = '#f44336';
                } else {
                  nombreDepto = g.nombre;
                  colorFondo = 'linear-gradient(120deg, #e3f2fd 60%, #bbdefb 100%)';
                  colorTexto = '#1976d2';
                }
                // Capitalizar la palabra Grilla
                let nombreGrilla = g.nombre.replace(/grilla/gi, m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
                // Si el nombreDepto es distinto al nombre original, usarlo
                let label = nombreDepto !== g.nombre ? nombreDepto : nombreGrilla;
                return (
                  <a
                    key={(g.url ? g.url : 'grilla') + '-' + idx}
                    href={g.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: colorFondo,
                      borderRadius: 8,
                      border: '2px solid #1976d2',
                      padding: '22px 0',
                      fontWeight: 'normal',
                      fontSize: 18,
                      color: colorTexto,
                      textAlign: 'center',
                      textDecoration: 'none',
                      width: '100%',
                      maxWidth: 420,
                      minWidth: 220,
                      marginBottom: 0,
                      display: 'block',
                      boxShadow: '0 2px 12px #1976d233',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      letterSpacing: 0.5,
                      marginLeft: 'auto',
                      marginRight: 'auto'
                    }}
                  >
                    {label.toUpperCase()}
                  </a>
                );
              })}
            </div>
          )}
        </Modal>
        {/* Modal para historial de versiones */}
        <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
          <ModalTitle>Historial de versiones.</ModalTitle>
          {historyLoading && <div style={{ textAlign: 'center', margin: 18 }}>Cargando...</div>}
          {historyError && <div style={{ color: '#d32f2f', textAlign: 'center', margin: 18 }}>{historyError}</div>}
          {!historyLoading && !historyError && historyData && historyData.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {historyData.map((h, idx) => (
                <li key={h.id} style={{ background: h.is_active ? '#e3f2fd' : '#eee', borderRadius: 8, marginBottom: 10, padding: 12, border: h.is_active ? '2px solid #1976d2' : '1px solid #bbb' }}>
                  <div style={{ fontWeight: 700, color: '#1976d2', fontSize: 16 }}>{h.titulo}</div>
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>{h.descripcion}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Fecha: {h.fecha_inicio ? new Date(h.fecha_inicio).toLocaleDateString('es-AR') : ''}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Creado: {h.created_at ? new Date(h.created_at).toLocaleString('es-AR', { hour12: false }) : ''}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>Usuario: {h.username}</div>
                  <div style={{ fontSize: 12, color: h.is_active ? '#388e3c' : '#b71c1c', fontWeight: 600 }}>{h.is_active ? 'Versión activa' : 'Versión anterior'}</div>
                </li>
              ))}
            </ul>
          )}
          {!historyLoading && !historyError && (!historyData || historyData.length === 0) && (
            <div style={{ color: '#888', textAlign: 'center', margin: 18 }}>No hay historial para esta actividad.</div>
          )}
        </Modal>
      </div>
    </div>
  );
}

export default App;
// Componente AccordionItem
function AccordionItem({ act, theme, editingId, editForm, handleStartEdit, handleDeleteActivity, handleCancelEdit, handleSaveEdit, setEditForm, selectedDate, activities, user, handleSaveEditActivity, handleShowHistory }) {
  const [open, setOpen] = useState(false);
  const isEditing = editingId === act.id;
  return (
    <li style={{ marginBottom: 10, borderRadius: 6, background: theme === 'dark' ? '#23272f' : '#fff', boxShadow: theme === 'dark' ? '0 1px 4px #0008' : '0 1px 4px #0001', overflow: 'hidden', border: '1px solid #ddd', position: 'relative', minHeight: 80 }}>
      <button
        onClick={() => {
          setOpen(o => !o);
          if (!isEditing && !open) {
            setEditForm({ title: act.title, description: act.description });
          }
        }}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'none',
          border: 'none',
          padding: '10px 12px',
          fontSize: 17,
          fontWeight: 700,
          color: theme === 'dark' ? '#f7f7f7' : '#1976d2',
          cursor: 'pointer',
          outline: 'none',
        }}
        aria-expanded={open}
      >
        {act.title}
        <span style={{ float: 'right', fontWeight: 400, fontSize: 15 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '10px 12px', borderTop: '1px solid #eee', color: theme === 'dark' ? '#f7f7f7' : '#222', fontSize: 15, position: 'relative', minHeight: 60 }}>
          {isEditing ? (
            <form
              onSubmit={e => { e.preventDefault(); handleSaveEditActivity(act.id, selectedDate); }}
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <input
                name="title"
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título"
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 15 }}
                required
                disabled={!user}
              />
              <textarea
                name="description"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descripción"
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #bbb', fontSize: 15, minHeight: 48 }}
                disabled={!user}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="submit" style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: user ? 'pointer' : 'not-allowed' }} disabled={!user}>Guardar</button>
                <button type="button" onClick={handleCancelEdit} style={{ background: '#eee', color: '#222', border: 'none', borderRadius: 6, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancelar</button>
              </div>
            </form>
          ) : (
            <>
              <div style={{ wordBreak: 'break-word', overflowWrap: 'break-word', minWidth: 0 }}>{act.description}</div>
              
              <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                {/* Solo mostrar user_id o username si hay usuario logueado */}
                {user ? (act.user_id || act.username) : null}
                {user && user.role === 'admin' && act.created_at && (
                  <span style={{ marginLeft: 12, color: '#888' }}>
                    <span style={{ fontWeight: 600 }}>Creado:</span> {new Date(act.created_at).toLocaleString('es-AR')}
                  </span>
                )}
              </div>
              {user && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 12 }}>
                  {(user.role === 'admin' || user.id === act.user_id) && (
                    <button onClick={() => handleStartEdit(act)} title="Editar" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#1976d2', fontSize: 22, display: 'flex', alignItems: 'center' }}>
                      <EditIcon style={{ fontSize: 24, color: '#1976d2' }} />
                    </button>
                  )}
                  {(user.role === 'admin' || user.id === act.user_id) && (
                    <button onClick={() => handleDeleteActivity(act.id)} title="Eliminar" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#d32f2f', fontSize: 22, display: 'flex', alignItems: 'center' }}>
                      <DeleteIcon style={{ fontSize: 24, color: '#d32f2f' }} />
                    </button>
                  )}
                  {user.role === 'admin' && (
                    <button onClick={() => handleShowHistory(act.id)} title="Ver historial" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#888', fontSize: 18, display: 'flex', alignItems: 'center', textDecoration: 'underline', marginLeft: 4 }}>
                      Historial
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </li>
  );
}

