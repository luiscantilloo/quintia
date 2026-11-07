import Link from "next/link";
import { LandingFooter, LandingHeader } from "./LandingChrome";

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-7 scroll-mt-24 text-balance font-titulos text-[clamp(24px,3vw,28px)] font-semibold leading-[1.2]"
    >
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-3 font-titulos text-[21px] font-semibold leading-[1.3]">{children}</h3>;
}

function P({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <p
      className={`m-0 text-pretty font-texto text-lg leading-[1.65] ${muted ? "text-texto-secundario" : ""}`}
    >
      {children}
    </p>
  );
}

function Ul({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="m-0 flex list-disc flex-col gap-2 pl-[1.4em]">
      {items.map((item, i) => (
        <li key={i} className="pl-1 font-texto text-lg leading-[1.6]">
          {item}
        </li>
      ))}
    </ul>
  );
}

function Ol({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="m-0 flex list-decimal flex-col gap-2 pl-[1.4em]">
      {items.map((item, i) => (
        <li key={i} className="pl-1 font-texto text-lg leading-[1.6]">
          {item}
        </li>
      ))}
    </ol>
  );
}

const TOC = [
  { href: "#1-responsable-del-tratamiento", label: "1. Responsable del tratamiento" },
  { href: "#2-definiciones", label: "2. Definiciones" },
  { href: "#3-a-quien-aplica", label: "3. A quién aplica" },
  { href: "#4-datos-que-tratamos", label: "4. Datos que tratamos" },
  { href: "#5-principios", label: "5. Principios" },
  { href: "#6-autorizacion", label: "6. Autorización" },
  { href: "#7-finalidades-del-tratamiento", label: "7. Finalidades del tratamiento" },
  { href: "#8-uso-de-inteligencia-artificial-teo", label: "8. Uso de inteligencia artificial (TEJIVA)" },
  {
    href: "#9-quien-accede-a-los-datos-transmision-y-transferencia",
    label: "9. Quién accede a los datos, transmisión y transferencia",
  },
  { href: "#10-datos-de-ninos-ninas-y-adolescentes", label: "10. Datos de niños, niñas y adolescentes" },
  { href: "#11-derechos-de-los-titulares", label: "11. Derechos de los titulares" },
  {
    href: "#12-como-ejercer-sus-derechos-consultas-y-reclamos",
    label: "12. Cómo ejercer sus derechos: consultas y reclamos",
  },
  { href: "#13-seguridad", label: "13. Seguridad" },
  { href: "#14-conservacion-y-supresion", label: "14. Conservación y supresión" },
  { href: "#15-vigencia-cambios-y-bases-de-datos", label: "15. Vigencia, cambios y bases de datos" },
  { href: "#16-autoridad-de-proteccion-de-datos", label: "16. Autoridad de protección de datos" },
] as const;

export function TratamientoDatosScreen() {
  return (
    <div className="min-h-svh overflow-x-clip bg-pl-niebla text-pl-tinta">
      <LandingHeader sticky />
      <main className="flex justify-center px-4 pb-[72px] pt-10">
        <article className="flex w-full max-w-[70ch] flex-col gap-[18px]">
          <Link
            href="/landing"
            className="inline-flex min-h-11 items-center gap-2 self-start font-texto text-[17px] font-semibold text-nara-tinta hover:underline"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver al inicio
          </Link>

          <h1 className="m-0 text-balance font-titulos text-[clamp(32px,5vw,48px)] font-semibold leading-[1.1]">
            Política de tratamiento de datos personales
          </h1>

          <P muted>
            <strong className="font-bold text-nara-tinta">
              QUINTIA · Programa de acompañamiento para personas mayores
            </strong>
            <br />
            Versión 1
          </P>

          <P muted>
            Esta política explica cómo recolectamos, usamos, guardamos, compartimos y protegemos los datos personales
            de quienes participan en el programa y de quienes usan la plataforma QUINTIA. Se expide en cumplimiento de la{" "}
            <strong className="font-bold text-nara-tinta">Ley 1581 de 2012</strong>, el{" "}
            <strong className="font-bold text-nara-tinta">Decreto 1377 de 2013</strong> (compilado en el{" "}
            <strong className="font-bold text-nara-tinta">Decreto 1074 de 2015</strong>) y las demás normas que los
            modifiquen o complementen.
          </P>

          <P>
            Si prefiere una versión corta y sencilla, lea la{" "}
            <Link href="/landing/privacidad" className="underline underline-offset-[3px] hover:text-texto-secundario">
              Política de privacidad
            </Link>
            .
          </P>

          <nav
            aria-label="Contenido"
            className="mt-2 rounded-[20px] border border-linea bg-nara-blanco px-6 py-5"
          >
            <p className="mb-2.5 font-texto text-sm font-semibold uppercase tracking-[0.06em] text-texto-secundario">
              Contenido
            </p>
            <ol className="m-0 flex list-none flex-col gap-0.5 p-0">
              {TOC.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex min-h-10 items-center font-texto text-[17px] font-medium text-nara-tinta underline underline-offset-[3px] hover:text-texto-secundario"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <H2 id="1-responsable-del-tratamiento">1. Responsable del tratamiento</H2>
          <P>
            El responsable del tratamiento es{" "}
            <strong className="font-bold">la entidad que ejecuta el programa QUINTIA</strong>. Su razón social, NIT y
            domicilio constan en el documento de autorización que cada persona recibe y firma en la visita, y se
            informan a quien los solicite por los canales de la sección 12.
          </P>
          <P>Las consultas y reclamos las atiende el área responsable de protección de datos del programa.</P>
          <P>
            En esta política, «QUINTIA», «nosotros» y «el programa» se refieren a esa entidad.
          </P>

          <H2 id="2-definiciones">2. Definiciones</H2>
          <Ul
            items={[
              <>
                <strong className="font-bold">Dato personal:</strong> información que identifica o puede identificar a
                una persona.
              </>,
              <>
                <strong className="font-bold">Dato sensible:</strong> dato que afecta la intimidad de la persona o cuyo
                uso indebido puede causar discriminación, como los datos de salud.
              </>,
              <>
                <strong className="font-bold">Titular:</strong> la persona a quien se refieren los datos.
              </>,
              <>
                <strong className="font-bold">Responsable:</strong> quien decide sobre el tratamiento de los datos.
              </>,
              <>
                <strong className="font-bold">Encargado:</strong> quien trata datos por cuenta del responsable.
              </>,
              <>
                <strong className="font-bold">Tratamiento:</strong> cualquier operación sobre los datos: recolectarlos,
                guardarlos, usarlos, compartirlos o eliminarlos.
              </>,
              <>
                <strong className="font-bold">Autorización:</strong> el permiso previo, expreso e informado del titular.
              </>,
              <>
                <strong className="font-bold">Seudonimización:</strong> separar los datos de identidad del resto, de modo
                que no se pueda saber de quién son sin información adicional que se guarda por aparte.
              </>,
            ]}
          />

          <H2 id="3-a-quien-aplica">3. A quién aplica</H2>
          <P>Esta política aplica a los datos de:</P>
          <Ul
            items={[
              <>
                Las personas que participan en el programa (<strong className="font-bold">titulares</strong>) y, cuando
                corresponda, sus familiares o contactos de apoyo.
              </>,
              "El personal del programa: expertos de campo, equipo clínico, administradoras y observadores.",
              "Quienes visitan esta página o usan la plataforma.",
            ]}
          />

          <H2 id="4-datos-que-tratamos">4. Datos que tratamos</H2>
          <P>
            <strong className="font-bold">Datos de identificación y contacto:</strong> nombre, documento de identidad,
            edad o fecha de nacimiento, dirección o ubicación de residencia (municipio y vereda), teléfono propio o de
            un familiar o vecino, y los datos del contacto de apoyo que usted indique.
          </P>
          <P>
            <strong className="font-bold">Datos sensibles, relativos a la salud:</strong>
          </P>
          <Ul
            items={[
              "Respuestas a cuestionarios sobre el estado de ánimo y la salud mental.",
              "Resultados y clasificaciones derivadas de esas respuestas.",
              "Lo que la persona comunica a TEJIVA, a su psicóloga o a su experto de campo, en texto o en audio.",
              "Seguimiento clínico, alertas, notas, remisiones y respuestas de las instituciones de salud.",
            ]}
          />
          <P>
            <strong className="font-bold">Datos sobre cómo prefiere comunicarse:</strong> capacidad de uso de
            tecnología, tipo de celular, canal elegido (app, WhatsApp, papel, visitas o llamadas).
          </P>
          <P>
            <strong className="font-bold">Datos de las visitas:</strong> fecha, hora y lugar, y datos de verificación
            del trabajo de campo.
          </P>
          <P>
            <strong className="font-bold">Datos de autorizaciones:</strong> consentimientos otorgados o retirados, con
            fecha, y firma o, cuando la persona no sabe firmar, la firma a ruego de quien firma por ella.
          </P>
          <P>
            <strong className="font-bold">Datos de uso de la plataforma:</strong> usuario, accesos, acciones realizadas,
            y registro del uso de la inteligencia artificial.
          </P>
          <P>
            <strong className="font-bold">Datos de personas menores de edad:</strong> ver la sección 10.
          </P>
          <H3>Datos sensibles: usted no está obligado a autorizarlos</H3>
          <P>
            Los datos de salud son sensibles.{" "}
            <strong className="font-bold">
              Ninguna persona está obligada a autorizar su tratamiento ni a responder preguntas sobre ellos.
            </strong>{" "}
            Solo los tratamos con su autorización explícita, salvo los casos que la ley permite (sección 6). Si decide
            no autorizarlos, el equipo le explicará qué apoyo se puede brindar sin esos datos.
          </P>

          <H2 id="5-principios">5. Principios</H2>
          <P>
            Tratamos los datos conforme a los principios de{" "}
            <strong className="font-bold">
              legalidad, finalidad, libertad, veracidad, transparencia, acceso y circulación restringida, seguridad y
              confidencialidad
            </strong>
            . En particular:
          </P>
          <Ul
            items={[
              "Solo pedimos los datos que necesitamos para las finalidades que le informamos.",
              "Usted puede acceder a sus datos y corregirlos.",
              "Los datos no se publican ni se entregan a terceros por fuera de lo que aquí se explica.",
              "Quien trabaja con los datos mantiene la reserva, aun después de terminar su relación con el programa.",
            ]}
          />

          <H2 id="6-autorizacion">6. Autorización</H2>
          <Ul
            items={[
              <>
                <strong className="font-bold">Se pide antes de tratar los datos</strong>, de forma clara, y se guarda
                constancia de ella.
              </>,
              <>
                <strong className="font-bold">Forma de otorgarla:</strong> por escrito (con firma o firma a ruego), en
                la aplicación, o por otro medio verificable que permita comprobar que se otorgó.
              </>,
              <>
                <strong className="font-bold">Es revocable.</strong> Usted puede retirarla en cualquier momento, sin
                costo, por los canales de la sección 12. También puede cambiar sus permisos en la sección{" "}
                <strong className="font-bold">Historial</strong> de la app. Retirar la autorización no afecta el
                tratamiento hecho antes, y no procede cuando exista un deber legal de conservar los datos.
              </>,
              <>
                <strong className="font-bold">Permisos separados:</strong> los usos adicionales (por ejemplo, compartir
                datos con un hospital o usar datos anónimos para investigación) se autorizan aparte y también se pueden
                retirar. Si retira la autorización de remisión, el caso deja de ser visible para la institución de
                salud.
              </>,
              <>
                <strong className="font-bold">Casos en que la ley permite tratar datos sin autorización,</strong> entre
                ellos: la información que pida una entidad pública o una orden judicial en ejercicio de sus funciones, y
                los casos de <strong className="font-bold">urgencia médica o sanitaria</strong>. En una urgencia, solo
                compartimos lo necesario para atender a la persona.
              </>,
            ]}
          />

          <H2 id="7-finalidades-del-tratamiento">7. Finalidades del tratamiento</H2>
          <P>Usamos los datos para:</P>
          <Ol
            items={[
              <>
                <strong className="font-bold">Acompañar y atender a la persona:</strong> hacer la visita, evaluar su
                situación, definir su ruta de cuidado y brindar acompañamiento por el canal que pueda usar.
              </>,
              <>
                <strong className="font-bold">Seguimiento clínico:</strong> que el equipo clínico haga seguimiento,
                preparar sesiones, y registrar la evolución y las decisiones.
              </>,
              <>
                <strong className="font-bold">Detectar y responder a situaciones de riesgo:</strong> identificar señales
                de alerta en los cuestionarios y las conversaciones, y comunicarnos con la persona lo antes posible.
              </>,
              <>
                <strong className="font-bold">Remisión y coordinación con instituciones de salud:</strong> compartir lo
                necesario con hospitales o instituciones, con autorización de la persona, y recibir la respuesta.
              </>,
              <>
                <strong className="font-bold">Comunicarnos con usted:</strong> recordatorios, citas, mensajes de
                seguimiento y avisos sobre esta política.
              </>,
              <>
                <strong className="font-bold">Control de calidad del trabajo de campo:</strong> verificar las visitas, y
                revisar la calidad del acompañamiento.
              </>,
              <>
                <strong className="font-bold">Informes, estadísticas y evaluación del programa:</strong> con datos
                agregados o sin identificar a la persona, para quienes financian, evalúan o supervisan el programa.
              </>,
              <>
                <strong className="font-bold">Investigación:</strong> únicamente con datos seudonimizados, con
                aprobación ética, y solo de quienes lo autorizaron. Las conversaciones con la inteligencia artificial
                solo se usan con un permiso adicional.
              </>,
              <>
                <strong className="font-bold">Seguridad y auditoría:</strong> proteger la plataforma, controlar los
                accesos y atender requerimientos de autoridades.
              </>,
              <>
                <strong className="font-bold">Cumplir obligaciones legales y contractuales.</strong>
              </>,
            ]}
          />
          <P>
            <strong className="font-bold">No vendemos datos personales ni los usamos para publicidad.</strong>
          </P>

          <H2 id="8-uso-de-inteligencia-artificial-teo">8. Uso de inteligencia artificial (TEJIVA)</H2>
          <Ul
            items={[
              <>
                <strong className="font-bold">TEJIVA es un acompañante con inteligencia artificial.</strong> No diagnostica,
                no receta, no toma decisiones clínicas y no reemplaza a un profesional.
              </>,
              <>
                Lo que TEJIVA sugiere <strong className="font-bold">no se vuelve un dato clínico</strong> hasta que una
                persona del equipo lo revisa y lo confirma.
              </>,
              <>
                Ante señales de riesgo, las alertas se revisan <strong className="font-bold">antes</strong> de la
                respuesta de la IA, y una persona del equipo se comunica con la persona. El tiempo de respuesta es una
                meta del programa y no una garantía.
              </>,
              "Las conversaciones con TEJIVA son datos sensibles y reciben la protección de esta política.",
              "Registramos el uso de la inteligencia artificial para poder auditarlo.",
              "Los proveedores tecnológicos que apoyan a TEJIVA tratan los datos solo para prestar su servicio y bajo las condiciones de la sección 9.",
            ]}
          />

          <H2 id="9-quien-accede-a-los-datos-transmision-y-transferencia">
            9. Quién accede a los datos, transmisión y transferencia
          </H2>
          <P>
            <strong className="font-bold">Acceso interno.</strong> Cada persona del programa ve únicamente lo que
            necesita para su función, según su rol y sus permisos. La identidad de la persona se guarda separada de sus
            datos clínicos.
          </P>
          <P>
            <strong className="font-bold">Instituciones de salud.</strong> Reciben solo los casos que se les remiten con
            autorización de la persona, y lo necesario para atenderla.
          </P>
          <P>
            <strong className="font-bold">Financiadores y supervisores.</strong> Reciben informes agregados. Los grupos
            de menos de 10 personas se ocultan.
          </P>
          <P>
            <strong className="font-bold">Investigadores.</strong> Acceden solo a datos seudonimizados, con aprobación
            ética y solo de quienes lo autorizaron.
          </P>
          <P>
            <strong className="font-bold">Encargados del tratamiento.</strong> Contamos con proveedores que tratan datos
            por nuestra cuenta (alojamiento de la información, mensajería, inteligencia artificial, entre otros). Les
            exigimos mediante contrato que traten los datos solo para las finalidades de esta política, que los
            protejan y que mantengan la reserva.
          </P>
          <P>
            <strong className="font-bold">Transmisión y transferencia internacional.</strong> Algunos proveedores pueden
            estar o almacenar datos fuera de Colombia. En esos casos lo hacemos conforme a la ley: solo con países que
            ofrezcan niveles adecuados de protección o, en su defecto, con las autorizaciones, contratos o excepciones
            que la ley permita.
          </P>
          <P>
            <strong className="font-bold">Autoridades.</strong> Entregamos datos cuando una autoridad competente lo
            exija conforme a la ley.
          </P>

          <H2 id="10-datos-de-ninos-ninas-y-adolescentes">10. Datos de niños, niñas y adolescentes</H2>
          <P>
            El tratamiento de datos de personas menores de 18 años solo se hace cuando responde y respeta el{" "}
            <strong className="font-bold">interés superior</strong> de la niña, el niño o el adolescente y asegura el
            respeto de sus derechos fundamentales, y{" "}
            <strong className="font-bold">con autorización de su padre, madre o representante legal</strong>, quien
            además puede ejercer sus derechos. Se escucha la opinión del menor según su madurez. Como los datos de
            salud son sensibles, ninguna persona está obligada a darlos.
          </P>

          <H2 id="11-derechos-de-los-titulares">11. Derechos de los titulares</H2>
          <P>Usted tiene derecho a:</P>
          <Ol
            items={[
              <>
                <strong className="font-bold">Conocer, actualizar y rectificar</strong> sus datos, frente al responsable
                o los encargados. Este derecho incluye los datos parciales, inexactos, incompletos o que induzcan a
                error.
              </>,
              <>
                <strong className="font-bold">Pedir copia de la autorización</strong> que otorgó, salvo cuando la ley no
                la exige.
              </>,
              <>
                <strong className="font-bold">Ser informado,</strong> si lo solicita, del uso que se ha dado a sus datos.
              </>,
              <>
                <strong className="font-bold">Presentar quejas</strong> ante la Superintendencia de Industria y Comercio
                por infracciones a la ley.
              </>,
              <>
                <strong className="font-bold">Revocar la autorización y pedir la supresión de sus datos</strong> cuando
                no se respeten los principios, derechos y garantías legales, o cuando ya no sean necesarios, salvo que
                exista un deber legal o contractual de conservarlos.
              </>,
              <>
                <strong className="font-bold">Acceder en forma gratuita</strong> a sus datos personales que hayan sido
                objeto de tratamiento.
              </>,
            ]}
          />
          <P>
            Puede ejercerlos usted, sus herederos, su representante o apoderado, o la persona que usted autorice,
            acreditando su calidad.
          </P>

          <H2 id="12-como-ejercer-sus-derechos-consultas-y-reclamos">
            12. Cómo ejercer sus derechos: consultas y reclamos
          </H2>
          <P>
            <strong className="font-bold">Canales.</strong> Puede presentar su solicitud:
          </P>
          <Ul
            items={[
              <>
                <strong className="font-bold">Con su experto de campo,</strong> en una visita o en una llamada. Él
                recibe la solicitud, deja constancia y nos la hace llegar tan pronto tenga conexión.{" "}
                <strong className="font-bold">
                  El plazo para responderle cuenta desde que el experto la recibe.
                </strong>
              </>,
              <>
                Por el mismo canal que ya usa con el programa: la app, WhatsApp o una llamada. La persona del equipo que
                lo atienda recibe la solicitud, deja constancia y la hace llegar al área responsable.
              </>,
              "Si es personal del programa, a través de la administración del programa.",
            ]}
          />
          <P>Las solicitudes las atiende el área responsable de protección de datos del programa.</P>
          <P>
            <strong className="font-bold">Qué debe incluir:</strong> nombre y documento del titular, descripción de lo
            que pide, un medio para responderle y, si actúa en nombre de otra persona, el documento que lo acredita. Si
            no sabe escribir o no tiene cómo enviarla, el experto puede ayudarle.
          </P>
          <P>
            <strong className="font-bold">Consultas</strong> (saber qué datos tenemos y cómo se usan): las respondemos
            en un máximo de <strong className="font-bold">10 días hábiles</strong>. Si no podemos, le informamos el
            motivo y la nueva fecha, que no pasará de <strong className="font-bold">5 días hábiles</strong> más.
          </P>
          <P>
            <strong className="font-bold">Reclamos</strong> (corregir, actualizar, suprimir, retirar la autorización o
            por presunto incumplimiento):
          </P>
          <Ol
            items={[
              "La solicitud debe describir los hechos e indicar cómo contactarlo. Si está incompleta, se lo informamos en los 5 días siguientes para que la complete. Si pasan 2 meses sin que la complete, se entiende que desistió.",
              <>
                Dentro de los 2 días hábiles siguientes a recibir el reclamo completo, marcamos el dato con la leyenda{" "}
                <strong className="font-bold">«reclamo en trámite»</strong>.
              </>,
              <>
                Lo resolvemos en un máximo de <strong className="font-bold">15 días hábiles</strong>. Si no podemos, le
                informamos el motivo y la nueva fecha, que no pasará de{" "}
                <strong className="font-bold">8 días hábiles</strong> más.
              </>,
            ]}
          />
          <P>
            <strong className="font-bold">Antes de acudir a la Superintendencia de Industria y Comercio</strong> debe
            haber presentado su consulta o reclamo ante nosotros.
          </P>

          <H2 id="13-seguridad">13. Seguridad</H2>
          <P>
            Aplicamos medidas técnicas, humanas y administrativas razonables para proteger los datos y evitar su
            pérdida, uso o acceso no autorizado. Entre ellas:
          </P>
          <Ul
            items={[
              "Identidad de las personas guardada separada de los datos clínicos.",
              "Roles y permisos por función, y acceso solo a lo necesario.",
              "Uso de datos seudonimizados o agregados para informes e investigación, y ocultamiento de grupos de menos de 10 personas.",
              "Registro de accesos y del uso de la inteligencia artificial.",
              "Compromisos de confidencialidad del personal y de los proveedores.",
              "Procedimientos para atender incidentes de seguridad. Si ocurre uno que afecte los datos, lo informaremos a las personas afectadas y a la autoridad, según la ley.",
            ]}
          />

          <H2 id="14-conservacion-y-supresion">14. Conservación y supresión</H2>
          <P>
            Conservamos los datos solo durante el tiempo necesario para las finalidades de esta política y para cumplir
            las obligaciones legales que apliquen (por ejemplo, las de conservación de la historia clínica). Cumplido
            ese tiempo, los eliminamos o los anonimizamos de forma que no se pueda identificar a la persona.
          </P>

          <H2 id="15-vigencia-cambios-y-bases-de-datos">15. Vigencia, cambios y bases de datos</H2>
          <Ul
            items={[
              "Esta política rige desde su publicación en esta página.",
              "Las bases de datos del programa estarán vigentes mientras dure el programa y el tiempo adicional que exijan la ley o la finalidad del tratamiento.",
              "Si hacemos cambios sustanciales, se lo informaremos por el canal que usted usa y publicaremos la nueva versión en esta página con su fecha. Si el cambio afecta las finalidades de datos sensibles, volveremos a pedir su autorización.",
              "Esta página pública no usa cookies de seguimiento ni herramientas de análisis.",
            ]}
          />

          <H2 id="16-autoridad-de-proteccion-de-datos">16. Autoridad de protección de datos</H2>
          <P>
            <strong className="font-bold">Superintendencia de Industria y Comercio (SIC)</strong>, Delegatura para la
            Protección de Datos Personales. Sitio web: www.sic.gov.co.
          </P>
          <P>
            <em>Ley 1581 de 2012; Decreto 1377 de 2013, compilado en el Decreto 1074 de 2015.</em>
          </P>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
