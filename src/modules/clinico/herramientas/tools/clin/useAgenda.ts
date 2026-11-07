"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { aceptarPropuesta, actualizarCita, listarAgenda, organizarPaciente, type CambioCita } from "./acciones";
import type { Agenda, Cita, PacienteAgenda } from "./tipos";

export type Borrador = { porPid: Record<string, Cita[]>; notas: { pid: string; n: string }[]; origen: string; visto?: boolean };
export type Modal = null | { tipo: "obs"; id: string } | { tipo: "agenda" } | { tipo: "ruta" };
export type Pensando = false | { i: number; n: number; nombre: string };

const ordenar = (l: Cita[]) => l.slice().sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora));

/** Estado de la agenda del clínico: misma lógica del mockup citas-clinico-v2, con datos del servidor. */
export function useAgenda(patientIdFicha: string) {
  const [agenda, setAgenda] = useState<Agenda | null>(null);
  const [error, setError] = useState("");
  const [selCita, setSelCita] = useState<string | null>(null);
  const [selDia, setSelDia] = useState<string | null>(null);
  const [mesAgenda, setMesAgenda] = useState<string | null>(null);
  const [borrador, setBorrador] = useState<Borrador | null>(null);
  const [pensando, setPensando] = useState<Pensando>(false);
  const [modal, setModal] = useState<Modal>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const r = await listarAgenda();
    if (r.ok) {
      setAgenda(r.data);
      setError("");
    } else setError(r.error);
    return r;
  }, []);

  useEffect(() => {
    let vivo = true;
    listarAgenda().then((r) => {
      if (!vivo) return;
      if (!r.ok) return setError(r.error);
      setAgenda(r.data);
      // Abre en la cita del paciente de la ficha: la que está por cerrar, la próxima o la última.
      const propias = ordenar(r.data.citas.filter((c) => c.patientId === patientIdFicha));
      const c = propias.find((x) => !x.hecha && x.fecha < r.data.hoy) || propias.find((x) => !x.hecha && x.fecha >= r.data.hoy) || propias[propias.length - 1];
      if (c) {
        setSelCita(c.id);
        setMesAgenda(c.fecha.slice(0, 7));
      }
    });
    return () => {
      vivo = false;
    };
  }, [patientIdFicha]);

  const hoy = agenda?.hoy || "";
  const P = useCallback((id: string) => agenda?.pacientes.find((p) => p.id === id) as PacienteAgenda, [agenda]);
  const hecha = (c: Cita) => c.hecha === true;
  const porCerrar = useCallback((c: Cita) => !c.hecha && c.fecha < hoy, [hoy]);

  const d = useMemo(() => {
    const citas = ordenar(agenda?.citas || []);
    const pasadas = citas.filter((c) => c.hecha || c.fecha < hoy);
    const conBorrador = !!borrador && Object.values(borrador.porPid).some((l) => l.length);
    // Con una propuesta abierta se ven las citas ya pasadas + la propuesta (las futuras se van a reemplazar).
    const vista = conBorrador ? ordenar(pasadas.concat(Object.values(borrador!.porPid).flat())) : citas;
    const fijas = vista.filter((c) => !c.borr);
    const proxGlobal = vista.find((c) => !c.hecha && c.fecha >= hoy) || null;
    const citaActual =
      fijas.find((c) => c.id === selCita) || fijas.find((c) => !c.hecha && c.fecha >= hoy) || fijas.filter((c) => !c.hecha && c.fecha < hoy).pop() || fijas[fijas.length - 1] || null;
    const desactualizados = (agenda?.pacientes || []).filter((p) => citas.some((c) => c.patientId === p.id && !c.hecha && c.fecha >= hoy && c.plan && c.plan !== p.plan));
    return { citas, vista, fijas, proxGlobal, citaActual, conBorrador, desactualizados };
  }, [agenda, borrador, hoy, selCita]);

  const reemplazar = (c: Cita) => setAgenda((a) => (a ? { ...a, citas: a.citas.map((x) => (x.id === c.id ? c : x)) } : a));

  const cambiar = async (id: string, cambio: CambioCita) => {
    setGuardando(true);
    const r = await actualizarCita(id, cambio);
    setGuardando(false);
    if (r.ok) {
      reemplazar(r.data);
      setSelCita(r.data.id);
      setError("");
    } else setError(r.error);
    return r.ok;
  };

  const organizar = async () => {
    if (!agenda) return;
    setModal(null);
    const ps = agenda.pacientes;
    const ocup: string[] = [];
    const porPid: Record<string, Cita[]> = {};
    const notas: { pid: string; n: string }[] = [];
    let modelo = "";
    let ms = 0;
    let reales = 0;
    for (let i = 0; i < ps.length; i++) {
      setPensando({ i, n: ps.length, nombre: ps[i].name });
      const r = await organizarPaciente(ps[i].id, ocup);
      if (!r.ok) {
        setPensando(false);
        setError(r.error);
        return;
      }
      porPid[ps[i].id] = r.data.citas.map((c) => ({
        id: `borr|${ps[i].id}|${c.fecha}|${c.hora}`, patientId: ps[i].id, fecha: c.fecha, hora: c.hora, canal: ps[i].canal,
        hecha: false, obs: "", rc: null, rp: null, plan: ps[i].plan, borr: true,
      }));
      ocup.push(...r.data.citas.map((c) => `${c.fecha} ${c.hora}`));
      r.data.notas.forEach((n) => notas.push({ pid: ps[i].id, n }));
      modelo = r.data.modelo;
      ms += r.data.ms;
      if (r.data.real) reales++;
    }
    setPensando(false);
    const origen = reales
      ? `Propuesta de ${modelo} en ${(ms / 1000).toFixed(1).replace(".", ",")} s (${ps.length} ${ps.length === 1 ? "llamada" : "llamadas"}).`
      : "Propuesta con las reglas fijas (sin modelo).";
    setBorrador({ porPid, notas, origen });
    const primera = ordenar(Object.values(porPid).flat())[0];
    if (primera) setMesAgenda(primera.fecha.slice(0, 7));
    setSelDia(null);
  };

  const aceptar = async () => {
    if (!borrador) return;
    setGuardando(true);
    const porPid = Object.fromEntries(Object.entries(borrador.porPid).map(([pid, l]) => [pid, l.map((c) => ({ fecha: c.fecha, hora: c.hora }))]));
    const r = await aceptarPropuesta(porPid);
    if (r.ok) {
      setBorrador(null);
      setSelCita(null);
      setSelDia(null);
      setMesAgenda(null);
      await cargar();
    } else setError(r.error);
    setGuardando(false);
  };

  const irACita = (id: string) => {
    const c = d.fijas.find((x) => x.id === id);
    if (!c) return;
    setSelCita(c.id);
    setSelDia(null);
    setMesAgenda(c.fecha.slice(0, 7));
  };

  return {
    agenda, error, setError, hoy, P, hecha, porCerrar, ...d,
    selCita, selDia, setSelDia, setSelCita, mesAgenda, setMesAgenda,
    borrador, setBorrador, pensando, modal, setModal, guardando,
    cambiar, organizar, aceptar, irACita,
  };
}

export type AgendaVM = ReturnType<typeof useAgenda>;
