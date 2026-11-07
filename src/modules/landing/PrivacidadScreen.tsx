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

export function PrivacidadScreen() {
  return (
    <div className="min-h-svh overflow-x-clip bg-pl-niebla text-pl-tinta">
      <LandingHeader sticky />
      <main className="flex justify-center px-4 pb-[72px] pt-10">
        <article className="flex w-full max-w-[70ch] flex-col gap-[18px]">
          <Link
            href="/landing"
            className="inline-flex min-h-11 items-center gap-2 self-start font-texto text-[17px] font-semibold text-nara-tinta hover:underline"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Volver al inicio
          </Link>

          <h1 className="m-0 text-balance font-titulos text-[clamp(32px,5vw,48px)] font-semibold leading-[1.1]">
            Política de privacidad
          </h1>

          <P muted>
            <strong className="font-bold text-nara-tinta">
              QUINTIA · Programa de acompañamiento para personas mayores
            </strong>
            <br />
            Versión 1
          </P>

          <P muted>
            En QUINTIA cuidamos lo que usted nos cuenta. Esta página le explica, en palabras sencillas, qué datos usamos,
            para qué, quién puede verlos y qué puede hacer usted con ellos.
          </P>

          <P>
            La versión completa y legal está en la{" "}
            <Link
              href="/landing/tratamiento-de-datos"
              className="underline underline-offset-[3px] hover:text-texto-secundario"
            >
              Política de tratamiento de datos personales
            </Link>
            .
          </P>

          <H2 id="lo-mas-importante">Lo más importante</H2>
          <Ul
            items={[
              <>
                <strong className="font-bold">Sus datos son suyos.</strong> Usted decide quién los ve.
              </>,
              <>
                <strong className="font-bold">No vendemos sus datos</strong> ni los usamos para publicidad.
              </>,
              <>
                <strong className="font-bold">Participar es voluntario.</strong> Usted puede retirar su permiso cuando
                quiera.
              </>,
              <>
                <strong className="font-bold">Detrás de QUINTIA siempre hay un equipo de personas.</strong> TEJIVA es un
                acompañante con inteligencia artificial: no diagnostica, no receta y no reemplaza a su psicóloga. Nada
                cuenta hasta que una persona del equipo lo confirma.
              </>,
            ]}
          />

          <H2 id="quien-cuida-sus-datos">Quién cuida sus datos</H2>
          <P>
            El responsable de sus datos es{" "}
            <strong className="font-bold">la entidad que ejecuta el programa QUINTIA</strong>. Su nombre y sus datos
            aparecen en el documento de autorización que usted recibe y firma en la visita.
          </P>
          <P>
            Para cualquier pregunta sobre sus datos, hable con su{" "}
            <strong className="font-bold">experto de campo</strong>, en una visita o en una llamada. También puede
            pedirlo por el mismo canal que ya usa con el programa (la app o WhatsApp). La persona que lo atienda
            recibirá su solicitud y la hará llegar al área responsable de proteger sus datos.
          </P>

          <H2 id="que-datos-usamos">Qué datos usamos</H2>
          <Ul
            items={[
              <>
                <strong className="font-bold">Quién es usted y cómo encontrarlo:</strong> nombre, documento, dónde vive,
                su teléfono o el de un familiar o vecino.
              </>,
              <>
                <strong className="font-bold">Cómo se siente:</strong> sus respuestas a las preguntas sobre su ánimo, lo
                que conversa con TEJIVA (en texto o en audio) y lo que le cuenta a su psicóloga o a su experto.
              </>,
              <>
                <strong className="font-bold">Cómo prefiere comunicarse:</strong> si tiene celular, si prefiere audios o
                papel.
              </>,
              <>
                <strong className="font-bold">De cada visita:</strong> la fecha, la hora y el lugar.
              </>,
              <>
                <strong className="font-bold">Sus permisos:</strong> qué autorizó y cuándo.
              </>,
            ]}
          />
          <P>
            Los datos sobre su salud emocional son <strong className="font-bold">datos sensibles</strong>.{" "}
            <strong className="font-bold">
              Usted no está obligado a darlos ni a responder preguntas sobre ellos.
            </strong>{" "}
            Si decide no hacerlo, puede hablar con su experto sobre qué ayuda es posible.
          </P>

          <H2 id="para-que-los-usamos">Para qué los usamos</H2>
          <Ul
            items={[
              "Acompañarlo en el canal que usted puede usar: app, WhatsApp o papel, visitas y llamadas.",
              "Armar su ruta de cuidado.",
              "Estar atentos si usted necesita ayuda y buscar comunicarnos con usted lo antes posible.",
              "Que su psicóloga haga el seguimiento de su caso.",
              <>
                Remitirlo a un hospital o institución de salud,{" "}
                <strong className="font-bold">solo si usted lo autoriza</strong>.
              </>,
              "Revisar la calidad del trabajo de campo.",
              <>
                Hacer informes y estudios <strong className="font-bold">sin que se sepa quién es usted</strong>.
              </>,
              "Cumplir lo que la ley nos exige.",
            ]}
          />

          <H2 id="quien-puede-verlos">Quién puede verlos</H2>
          <Ul
            items={[
              <>
                <strong className="font-bold">Su equipo del programa</strong> (psicóloga, experto de campo): lo necesario
                para acompañarlo.
              </>,
              <>
                <strong className="font-bold">Un hospital o institución de salud:</strong> solo si usted lo autoriza, y
                solo lo necesario para atenderlo.
              </>,
              <>
                <strong className="font-bold">Quienes financian el programa y quienes investigan:</strong> solo informes
                y datos que <strong className="font-bold">no permiten saber quién es usted</strong>. Los grupos de menos
                de 10 personas se ocultan. Las conversaciones con TEJIVA no se usan en investigación sin un permiso
                adicional suyo.
              </>,
              <>
                <strong className="font-bold">Empresas que nos prestan servicios técnicos</strong> (por ejemplo, para
                guardar la información, enviar mensajes o hacer funcionar a TEJIVA): solo para lo que nosotros les pedimos
                y bajo contrato.
              </>,
              <>
                <strong className="font-bold">Una autoridad,</strong> si la ley lo exige.
              </>,
              <>
                <strong className="font-bold">En una urgencia médica o sanitaria,</strong> podemos compartir lo necesario
                con quienes puedan atenderlo, aunque no haya un permiso previo, como lo permite la ley.
              </>,
            ]}
          />

          <H2 id="como-los-protegemos">Cómo los protegemos</H2>
          <Ul
            items={[
              <>
                Su identidad se guarda <strong className="font-bold">separada</strong> de sus datos clínicos.
              </>,
              "Cada persona del equipo solo ve lo que necesita para su trabajo.",
              <>
                Para informes y estudios usamos datos <strong className="font-bold">sin su nombre</strong>.
              </>,
              "Queda registro de quién consulta la información y de cuándo se usa la inteligencia artificial.",
              "Usamos medidas técnicas y de organización para evitar que sus datos se pierdan, se usen sin permiso o se conozcan por error.",
            ]}
          />

          <H2 id="sus-derechos">Sus derechos</H2>
          <P>Usted puede, cuando quiera y sin costo:</P>
          <Ul
            items={[
              <>
                <strong className="font-bold">Conocer</strong> qué datos suyos tenemos y cómo los usamos.
              </>,
              <>
                <strong className="font-bold">Corregirlos</strong> si están mal o incompletos.
              </>,
              <>
                <strong className="font-bold">Pedir una copia</strong> del permiso que nos dio.
              </>,
              <>
                <strong className="font-bold">Retirar su permiso</strong> y pedir que borremos sus datos, cuando la ley
                lo permita. Algunos datos pueden tener que conservarse por obligación legal.
              </>,
              <>
                <strong className="font-bold">Presentar una queja</strong> ante la Superintendencia de Industria y
                Comercio, la autoridad de protección de datos en Colombia.
              </>,
            ]}
          />
          <P>
            <strong className="font-bold">Cómo pedirlo:</strong> dígaselo a su experto de campo, en una visita o en una
            llamada, o pídalo por el mismo canal que ya usa con el programa (la app o WhatsApp). Si es una pregunta, le
            respondemos en máximo 10 días hábiles. Si es un reclamo, en máximo 15 días hábiles. Si necesitamos más
            tiempo, se lo avisamos antes con la razón.
          </P>
          <P>
            Si usa la app, también puede ver y cambiar sus permisos en la sección{" "}
            <strong className="font-bold">Historial</strong>.
          </P>

          <H2 id="esta-pagina-publica">Esta página pública</H2>
          <P>Esta página de QUINTIA no usa cookies de seguimiento ni herramientas de análisis.</P>

          <H2 id="cambios">Cambios</H2>
          <P>
            Si cambiamos esta política, publicaremos la nueva versión aquí, con su fecha. Si el cambio es importante, se
            lo avisaremos por el canal que usted usa.
          </P>
          <P>
            <em>Ley 1581 de 2012 y Decreto 1377 de 2013 (compilado en el Decreto 1074 de 2015).</em>
          </P>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
