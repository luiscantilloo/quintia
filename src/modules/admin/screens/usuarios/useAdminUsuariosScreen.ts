"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { filterRowsBySearch } from "@/components/shared/table-search/TableSearch";
import { adminPathForView } from "@/modules/admin/routes";
import { useNaraLive, useNaraStore } from "@/providers/nara-provider";
import { DEFAULT_PATIENT_MODULES } from "@/lib/db/patientModules";
import { minPasswordLengthForRole, passwordPolicyError } from "@/lib/auth/passwordPolicy";
import {
  generateAccessPassword,
  generateConsienteEmail,
} from "@/lib/auth/generateCredentials";
import {
  ACCOUNT_ROLE_LABELS,
  PROGRAM_ORG,
  isGestorRole,
  isPersonaRole,
} from "@/lib/db/roles";
import { withTestTerritory } from "@/lib/geo/colombia";

const ROLES = [...ACCOUNT_ROLE_LABELS];
const PAGE_SIZE = 5;
const GENERO_OPTS = ["Femenino", "Masculino", "No binario", "Otro", "Prefiere no decir"];
const CIVIL_OPTS = ["Soltero/a", "Casado/a", "Unión libre", "Separado/a", "Divorciado/a", "Viudo/a"];
const ESTRATO_OPTS = ["1", "2", "3", "4", "5", "6"];

type FormState = {
  id: string | null;
  name: string;
  firstName?: string;
  lastName?: string;
  contact: string;
  password?: string;
  role: string;
  terr: string;
  org: string;
  modules: string[];
  patientModules: string[];
  personId?: string;
  birthDate?: string;
  age?: string;
  phone?: string;
  place?: string;
  genero?: string;
  estadoCivil?: string;
  estrato?: string;
  status?: string;
  derived?: boolean;
  /** si | no | '' — solo aplica a persona acompañada */
  tieneCuidador?: "" | "si" | "no";
  caregiverAccountId?: string;
  caregiverFirstName?: string;
  caregiverLastName?: string;
  caregiverBirthDate?: string;
  caregiverAge?: string;
  caregiverGenero?: string;
  caregiverEstadoCivil?: string;
  caregiverEstrato?: string;
  caregiverPlace?: string;
  caregiverEmail?: string;
  caregiverPhone?: string;
  caregiverPassword?: string;
};

function ageFromBirth(iso: string): number {
  if (!iso) return 0;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return Math.max(0, age);
}

function emptyPatientFicha(): Partial<FormState> {
  return {
    personId: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    age: "",
    phone: "",
    place: "",
    genero: "",
    estadoCivil: "",
    estrato: "",
    contact: "",
    terr: "",
    tieneCuidador: "",
    caregiverAccountId: "",
    caregiverFirstName: "",
    caregiverLastName: "",
    caregiverBirthDate: "",
    caregiverAge: "",
    caregiverGenero: "",
    caregiverEstadoCivil: "",
    caregiverEstrato: "",
    caregiverPlace: "",
    caregiverEmail: "",
    caregiverPhone: "",
    caregiverPassword: "",
  };
}

function emptyCaregiverFields(): Partial<FormState> {
  return {
    caregiverFirstName: "",
    caregiverLastName: "",
    caregiverBirthDate: "",
    caregiverAge: "",
    caregiverGenero: "",
    caregiverEstadoCivil: "",
    caregiverEstrato: "",
    caregiverPlace: "",
    caregiverEmail: "",
    caregiverPhone: "",
    caregiverPassword: "",
  };
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

function joinName(firstName: string, lastName: string, fallback = ""): string {
  const n = [firstName, lastName].map((x) => String(x || "").trim()).filter(Boolean).join(" ");
  return n || fallback;
}

/** Departamentos del Eje (no son territorios asignables a un experto). */
const DEPT_NAMES = new Set([
  "quindío",
  "quindio",
  "risaralda",
  "caldas",
  "valle del cauca",
  "valle",
]);

function territoryNames(A: any, S: any): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const rows = [
    ...((S.territories || []) as { name?: string; dep?: string }[]),
    ...((A.TERRS || []) as { name?: string; dep?: string }[]),
  ];
  for (const t of rows) {
    const n = String(t?.name || "").trim();
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key) || DEPT_NAMES.has(key)) continue;
    // Si el “territorio” es solo el departamento (name === dep), omitir.
    const dep = String(t?.dep || "").trim().toLowerCase();
    if (dep && key === dep) continue;
    seen.add(key);
    out.push(n);
  }
  return withTestTerritory(out.sort((a, b) => a.localeCompare(b, "es")));
}

type UiState = {
  zoom: number;
  agentOpen: boolean;
  msg: string;
  rf: string;
  q: string;
  page: number;
  sel: string | null;
  f: FormState | null;
  err: string;
  pendingAsk: string;
};

const INITIAL: UiState = {
  zoom: 1,
  agentOpen: false,
  msg: "",
  rf: "",
  q: "",
  page: 0,
  sel: null,
  f: null,
  err: "",
  pendingAsk: "",
};

function looksLikeEmail(v: unknown): boolean {
  return /@/.test(String(v || ""));
}

function allUsers(A: any, S: any) {
  const acc = S.accounts.slice();
  const byAccountId = new Set(acc.map((a: any) => a.id).filter(Boolean));
  const names = new Set(acc.map((a: any) => a.name));
  A.experts(S).forEach((e: any) => {
    const linked =
      (e.accountId && acc.find((a: any) => a.id === e.accountId)) ||
      acc.find((a: any) => a.name === e.name);
    if (linked) return;
    if (e.accountId && byAccountId.has(e.accountId)) return;
    if (names.has(e.name)) return;
    const email = looksLikeEmail(e.email)
      ? String(e.email)
      : looksLikeEmail(e.contact)
        ? String(e.contact)
        : "";
    acc.push({
      id: e.accountId || e.id,
      name: e.name,
      email,
      contact: email,
      phone: e.phone || "",
      role: "Gestor de campo",
      org: PROGRAM_ORG,
      terr: e.terr,
      status: e.active === false ? "Inactivo" : "Activo",
      derived: true,
    });
  });
  return acc.map((a: any) => {
    const e =
      A.experts(S).find((x: any) => x.accountId && x.accountId === a.id) ||
      A.experts(S).find((x: any) => x.name === a.name);
    if (!e) return a;
    const email =
      (looksLikeEmail(a.email) && String(a.email)) ||
      (looksLikeEmail(a.contact) && String(a.contact)) ||
      (looksLikeEmail(e.email) && String(e.email)) ||
      "";
    return Object.assign({}, a, {
      terr: e.terr,
      phone: a.phone || e.phone || "",
      email,
      contact: email,
      status: e.active === false ? "Inactivo" : a.status,
    });
  });
}

export function useAdminUsuariosScreen() {
  const A = useNaraStore();
  const live = useNaraLive();
  const router = useRouter();
  const [st, setSt] = useState<UiState>({ ...INITIAL });

  const setState = useCallback((patch: Partial<UiState> | ((s: UiState) => UiState)) => {
    setSt((prev) => (typeof patch === "function" ? patch(prev) : { ...prev, ...patch }));
  }, []);

  useEffect(() => {
    const u = A.session() as { role?: string; roleId?: string } | null;
    if (!u || (u.roleId !== "admin" && !/Admin/i.test(u.role || ""))) {
      router.replace("/ingreso");
    }
  }, [A, router]);

  const v = useMemo(() => {
    const S = A.get();
    const C = A.C;
    const z = st.zoom || 1;
    const all = allUsers(A, S);
    const byRole = all.filter((u: any) => !st.rf || u.role === st.rf);
    const list = filterRowsBySearch(byRole, st.q);
    const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    const page = Math.min(Math.max(0, st.page || 0), totalPages - 1);
    const pageStart = page * PAGE_SIZE;
    const pageList = list.slice(pageStart, pageStart + PAGE_SIZE);
    const f = st.f;
    const isEdit = !!(f && f.id);
    const isPaciente = !!f && isPersonaRole(f.role);
    /** Alta de persona acompañada en admin = solo ficha manual (como Nueva persona). */
    const isManualPatient = isPaciente && !isEdit;
    const setF = (k: keyof FormState) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value;
      const next = Object.assign({}, f, { [k]: value }) as FormState;
      if (k === "firstName" || k === "lastName") {
        next.name = joinName(
          String(next.firstName || ""),
          String(next.lastName || ""),
          "",
        );
      }
      if (k === "birthDate") {
        next.age = value ? String(ageFromBirth(value)) : "";
      }
      if (k === "caregiverBirthDate") {
        next.caregiverAge = value ? String(ageFromBirth(value)) : "";
      }
      if (k === "tieneCuidador" && value !== "si") {
        Object.assign(next, emptyCaregiverFields());
      }
      setState({ f: next, err: "" });
    };
    const open = (u: any) => {
      const { firstName, lastName } = splitFullName(u.name || "");
      const peopleList = A.people ? A.people(S) : S.people || [];
      const linkedPerson = peopleList.find(
        (p: any) =>
          p.id === (u.personId || u.patientId) ||
          p.accountId === u.id ||
          (u.personId && p.code === u.personId),
      );
      const hasCg = !!(
        linkedPerson?.caregiverAccountId ||
        linkedPerson?.caregiverId ||
        linkedPerson?.tieneCuidador
      );
      setState({
        sel: u.id,
        err: "",
        f: {
          id: u.id,
          name: u.name,
          firstName: u.firstName || firstName,
          lastName: u.lastName || lastName,
          contact:
            (looksLikeEmail(u.email) && String(u.email)) ||
            (looksLikeEmail(u.contact) && String(u.contact)) ||
            "",
          phone: u.phone || (!looksLikeEmail(u.contact) ? String(u.contact || "") : ""),
          password: "",
          role: u.role,
          terr: u.terr,
          org: u.org,
          modules: (u.modules || A.OBS_DEFAULT_MODULES || []).slice(),
          patientModules: (u.patientModules || u.modulesEnabled || DEFAULT_PATIENT_MODULES).slice(),
          personId: u.personId || u.patientId || linkedPerson?.id || "",
          status: u.status,
          derived: u.derived,
          tieneCuidador: hasCg ? "si" : "",
          caregiverAccountId: String(
            linkedPerson?.caregiverAccountId || linkedPerson?.caregiverId || "",
          ),
          caregiverFirstName: String(
            linkedPerson?.caregiverFirstName ||
              String(linkedPerson?.caregiverName || "").split(/\s+/)[0] ||
              "",
          ),
          caregiverLastName: String(
            linkedPerson?.caregiverLastName ||
              String(linkedPerson?.caregiverName || "").split(/\s+/).slice(1).join(" ") ||
              "",
          ),
          caregiverBirthDate: String(linkedPerson?.caregiverBirthDate || ""),
          caregiverAge: String(linkedPerson?.caregiverAge || ""),
          caregiverGenero: String(linkedPerson?.caregiverGenero || ""),
          caregiverEstadoCivil: String(linkedPerson?.caregiverEstadoCivil || ""),
          caregiverEstrato: String(linkedPerson?.caregiverEstrato || ""),
          caregiverPlace: String(linkedPerson?.caregiverPlace || ""),
          caregiverEmail: String(linkedPerson?.caregiverEmail || ""),
          caregiverPhone: String(linkedPerson?.caregiverPhone || ""),
          caregiverPassword: "",
        },
      });
    };
    const allTerrNames = territoryNames(A, S);
    const isExpertoCampo = isGestorRole(f?.role);
    const terrOpts = isExpertoCampo
      ? allTerrNames
      : Array.from(new Set(["Todos"].concat(allTerrNames)));

    const save = async () => {
      if (!f) return;
      const fullName = joinName(
        String(f.firstName || ""),
        String(f.lastName || ""),
        f.name,
      );
      if (!String(f.firstName || "").trim() || !String(f.lastName || "").trim()) {
        return setState({
          err: isPersonaRole(f.role)
            ? "La persona debe tener nombre y apellido."
            : "Indique nombre y apellido para crear la cuenta.",
        });
      }
      if (isPersonaRole(f.role) && !isEdit) {
        const missing: string[] = [];
        if (!String(f.firstName || "").trim()) missing.push("nombre");
        if (!String(f.lastName || "").trim()) missing.push("apellido");
        if (!String(f.birthDate || "").trim()) missing.push("fecha de nacimiento");
        if (!String(f.place || "").trim()) missing.push("vereda o barrio");
        if (!String(f.terr || "").trim() || /^todos$/i.test(String(f.terr))) {
          missing.push("territorio");
        }
        if (!String(f.contact || "").trim()) missing.push("correo");
        if (missing.length) {
          return setState({
            err:
              missing.length === 1
                ? "Falta el dato: " + missing[0] + "."
                : "Faltan datos: " + missing.join(", ") + ".",
          });
        }
        const edadAlta = ageFromBirth(String(f.birthDate || "").trim());
        if (!(edadAlta >= 60 && edadAlta <= 110)) {
          return setState({ err: "La edad debe estar entre 60 y 110 años." });
        }
      }
      const addingCaregiver =
        isPersonaRole(f.role) &&
        f.tieneCuidador === "si" &&
        !String(f.caregiverAccountId || "").trim();
      if (addingCaregiver) {
        const cgFirst = String(f.caregiverFirstName || "").trim();
        const cgLast = String(f.caregiverLastName || "").trim();
        const cgBirth = String(f.caregiverBirthDate || "").trim();
        const cgAge = cgBirth ? ageFromBirth(cgBirth) : Number(f.caregiverAge) || 0;
        if (!cgFirst || !cgLast) {
          return setState({ err: "Escriba nombre y apellido del cuidador." });
        }
        if (!cgBirth) {
          return setState({ err: "Indique la fecha de nacimiento del cuidador." });
        }
        if (!(cgAge >= 18 && cgAge <= 110)) {
          return setState({ err: "La edad del cuidador debe estar entre 18 y 110 años." });
        }
        if (!String(f.caregiverPlace || "").trim()) {
          return setState({ err: "Indique vereda o barrio del cuidador." });
        }
        if (!/@/.test(String(f.caregiverEmail || ""))) {
          return setState({ err: "Use un correo válido para el cuidador." });
        }
        if (!(f.caregiverPassword || "").trim()) {
          return setState({ err: "Defina una contraseña para el cuidador." });
        }
        const cgPass = String(f.caregiverPassword || "").trim();
        const cgPolicy = passwordPolicyError({
          password: cgPass,
          email: String(f.caregiverEmail || ""),
          name: [cgFirst, cgLast].join(" "),
          role: "Cuidadora / familiar",
        });
        if (cgPolicy) return setState({ err: cgPolicy });
      }
      if (!fullName || !f.contact.trim()) {
        return setState({
          err: isPersonaRole(f.role)
            ? "La persona debe tener nombre, apellido y correo. Complete el correo si falta."
            : "Escriba el nombre y el correo.",
        });
      }
      if (!/@/.test(f.contact))
        return setState({ err: "Use un correo válido (ej. nombre@quintia.com) para el acceso." });
      if (!isEdit && !(f.password || "").trim())
        return setState({ err: "Defina una contraseña para el nuevo usuario." });
      const passTrim = (f.password || "").trim();
      if (passTrim) {
        const policyErr = passwordPolicyError({
          password: passTrim,
          email: f.contact,
          name: fullName,
          role: f.role,
        });
        if (policyErr) return setState({ err: policyErr });
      }
      if (f.role === "Observador" && !f.org.trim())
        return setState({ err: "Escriba la organización del observador." });
      if (isGestorRole(f.role)) {
        const oneTerr = String(f.terr || "")
          .split(/\s*[,;/|]\s*|\s+y\s+/i)
          .map((x) => x.trim())
          .filter(Boolean)[0];
        if (!oneTerr || /^todos$/i.test(oneTerr)) {
          return setState({ err: "El gestor de campo debe tener un único territorio asignado." });
        }
        f.terr = oneTerr;
      }

      const birthDate = String(f.birthDate || "").trim();
      const age = birthDate ? ageFromBirth(birthDate) : Number(f.age) || 0;
      const place = String(f.place || "").trim();
      const payload: any = {
        id: f.id || undefined,
        name: fullName,
        firstName: String(f.firstName || "").trim() || undefined,
        lastName: String(f.lastName || "").trim() || undefined,
        contact: f.contact.trim(),
        email: f.contact.trim(),
        password: (f.password || "").trim() || undefined,
        role: f.role,
        terr: f.terr,
        org: f.role === "Observador" ? f.org.trim() : PROGRAM_ORG,
        modules: f.role === "Observador" ? (A.OBS_DEFAULT_MODULES || []).slice() : undefined,
        patientModules: isPersonaRole(f.role) ? DEFAULT_PATIENT_MODULES.slice() : undefined,
        personId: isPersonaRole(f.role) && isEdit
          ? String(f.personId || "").trim() || undefined
          : undefined,
        patientId: isPersonaRole(f.role) && isEdit
          ? String(f.personId || "").trim() || undefined
          : undefined,
        status: f.status || "Activo",
        phone: String(f.phone || "").trim() || undefined,
      };

      if (isPersonaRole(f.role) && !isEdit) {
        payload.origin = "manual";
        payload.source = "admin-manual";
        payload.patientStatus = "Sin evaluación";
        payload.birthDate = birthDate;
        payload.age = age;
        payload.place = place;
        payload.phone = String(f.phone || "").trim();
        payload.genero = String(f.genero || "").trim();
        payload.estadoCivil = String(f.estadoCivil || "").trim();
        payload.estrato = String(f.estrato || "").trim();
        payload.rural = /vereda/i.test(place);
      }

      if (isPersonaRole(f.role)) {
        payload.tieneCuidador = f.tieneCuidador === "si";
        if (addingCaregiver) {
          const cgFirst = String(f.caregiverFirstName || "").trim();
          const cgLast = String(f.caregiverLastName || "").trim();
          const cgBirth = String(f.caregiverBirthDate || "").trim();
          payload.caregiver = {
            firstName: cgFirst,
            lastName: cgLast,
            name: [cgFirst, cgLast].filter(Boolean).join(" "),
            birthDate: cgBirth,
            age: cgBirth ? ageFromBirth(cgBirth) : Number(f.caregiverAge) || 0,
            email: String(f.caregiverEmail || "").trim().toLowerCase(),
            phone: String(f.caregiverPhone || "").trim(),
            password: String(f.caregiverPassword || "").trim(),
            place: String(f.caregiverPlace || "").trim(),
            genero: String(f.caregiverGenero || "").trim(),
            estadoCivil: String(f.caregiverEstadoCivil || "").trim(),
            estrato: String(f.caregiverEstrato || "").trim(),
          };
        }
      }

      try {
        const res = await fetch("/api/accounts", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) return setState({ err: data.error || "No se pudo guardar el usuario." });

        const acc = data.account;
        const person = data.person || null;
        const terrForExpert = String(person?.terr || f.terr || "").trim();
        const expertFromTerr = terrForExpert
          ? (A.experts ? A.experts(A.get()) : A.get().experts || []).find(
              (e: any) => e.terr === terrForExpert && e.active !== false,
            )
          : null;
        A.set((s: any) => {
          const list = Array.isArray(s.accounts) ? s.accounts.slice() : [];
          const i = list.findIndex((x: any) => x.id === acc.id);
          if (i >= 0) list[i] = { ...list[i], ...acc };
          else list.push({ ...acc, created: true });
          s.accounts = list;
          if (isGestorRole(acc.role)) {
            s.expertOv = s.expertOv || {};
            s.expertOv[acc.name] = Object.assign({}, s.expertOv[acc.name], {
              terr: acc.terr,
              phone: acc.phone || f.phone || "",
              email: acc.email || f.contact || "",
            });
          }
          const linkId =
            person?.id || payload.personId || acc.personId || acc.patientId;
          if (linkId) {
            s.people = Array.isArray(s.people) ? s.people : [];
            let pe = s.people.find(
              (p: any) => p.id === linkId || p.code === linkId || p.code === person?.code,
            );
            const expertName =
              String(person?.expert || "") ||
              String(expertFromTerr?.name || "") ||
              "";
            const expertId =
              String(person?.expertId || "") ||
              String(expertFromTerr?.id || expertFromTerr?.accountId || "") ||
              "";
            const personCode = String(person?.code || pe?.code || "");
            const clinName = String(person?.clin || pe?.clin || "");
            if (!pe) {
              pe = {
                id: linkId,
                code: personCode,
                name: fullName,
                firstName: payload.firstName,
                lastName: payload.lastName,
                email: payload.email,
                phone: payload.phone || "",
                birthDate: birthDate || person?.birthDate || "",
                age: age || person?.age || 0,
                place: place || person?.place || "",
                terr: terrForExpert,
                rural: payload.rural ?? person?.rural ?? false,
                genero: payload.genero || "",
                estadoCivil: payload.estadoCivil || "",
                estrato: payload.estrato || "",
                status: String(person?.status || "Sin evaluación"),
                profile: person?.profile ?? null,
                accountId: acc.id,
                expert: expertName,
                expertId,
                clin: clinName,
                source: payload.source || "admin",
                week: 0,
                weeks: 13,
              };
              s.people.push(pe);
            } else {
              Object.assign(pe, {
                accountId: acc.id,
                email: pe.email || payload.email,
                ...(personCode ? { code: personCode } : {}),
                ...(expertName ? { expert: expertName } : {}),
                ...(expertId ? { expertId } : {}),
                ...(clinName ? { clin: clinName } : {}),
                ...(terrForExpert ? { terr: terrForExpert } : {}),
              });
              if (!isEdit) {
                Object.assign(pe, {
                  name: fullName,
                  firstName: payload.firstName,
                  lastName: payload.lastName,
                  status: pe.status || "Sin evaluación",
                });
              }
            }
            if (person) {
              Object.assign(pe, {
                tieneCuidador: person.tieneCuidador === true,
                caregiverAccountId: person.caregiverAccountId || null,
                caregiverName: person.caregiverName || "",
                caregiverFirstName: person.caregiverFirstName || "",
                caregiverLastName: person.caregiverLastName || "",
                caregiverEmail: person.caregiverEmail || "",
                caregiverPhone: person.caregiverPhone || "",
                caregiverBirthDate: person.caregiverBirthDate || "",
                caregiverAge: person.caregiverAge || 0,
              });
            }
          }
          if (addingCaregiver && payload.caregiver?.email) {
            const cgEmail = payload.caregiver.email;
            const cgName = payload.caregiver.name;
            if (!list.some((a: any) => String(a.email || "").toLowerCase() === cgEmail)) {
              list.push({
                id: person?.caregiverAccountId || `cg-local-${Date.now().toString(36)}`,
                name: cgName,
                email: cgEmail,
                contact: cgEmail,
                phone: payload.caregiver.phone || "",
                role: "Cuidadora / familiar",
                roleId: "cuidador",
                terr: terrForExpert || f.terr,
                org: PROGRAM_ORG,
                status: "Activo",
                created: true,
              });
              s.accounts = list;
            }
          }
          A.logActivity(s, A.session()?.id || "admin", (isEdit ? "Editó" : "Creó") + " el usuario " + acc.name);
        });

        const cgHint = addingCaregiver
          ? " Cuidador creado con " + String(f.caregiverEmail || "") + "."
          : "";
        setState({
          f: null,
          sel: null,
          err: "",
          msg: isEdit
            ? "Cambios guardados para " + acc.name + " en MongoDB." + cgHint
            : "Usuario " +
              acc.name +
              " creado en MongoDB. Puede ingresar con " +
              acc.email +
              (payload.password ? " y la contraseña que definió." : ".") +
              cgHint,
        });
      } catch {
        setState({ err: "No se pudo conectar con la base de datos." });
      }
    };

    const act = f && isEdit ? S.activity.filter((a: any) => a.uid === f.id) : [];
    const hasLinkedCaregiver = !!(f && String(f.caregiverAccountId || "").trim());
    const showCaregiverForm = !!(isPaciente && f?.tieneCuidador === "si" && !hasLinkedCaregiver);
    const createRoles = ROLES as readonly string[];
    const filterRoles = Array.from(
      new Set([
        ...createRoles,
        ...all
          .map((u: any) => String(u.role || ""))
          .filter((r: string) => !!r && !createRoles.includes(r)),
      ]),
    );

    return {
      roles: ROLES,
      zoom: z,
      agentOpen: st.agentOpen,
      openAgent: () => setState({ agentOpen: true }),
      closeAgent: () => setState({ agentOpen: false, pendingAsk: "" }),
      pendingAsk: st.pendingAsk || "",
      ovW: window.innerWidth / z + "px",
      ovH: window.innerHeight / z + "px",
      drawerW: window.innerWidth < 720 ? window.innerWidth / z + "px" : "480px",
      agentAction: (a: string, p: any) => {
        if (a === "report") router.push("/informe?id=" + p + "&back=/usuarios");
        if (a === "detail") router.push(adminPathForView(p.target));
      },
      hasMsg: !!st.msg,
      msg: st.msg,
      clearMsg: () => setState({ msg: "" }),
      roleChips: ([["", "Todos"]] as [string, string][])
        .concat(filterRoles.map((r) => [r, r] as [string, string]))
        .map(([val, label]) => ({
          key: val || "all",
          label,
          n: val ? all.filter((u: any) => u.role === val).length : all.length,
          bd: st.rf === val ? C.verde : C.lineas,
          bg: st.rf === val ? "#E7FAF5" : "#fff",
          go: () => setState({ rf: val, page: 0 }),
        })),
      q: st.q,
      setQ: (value: string | ChangeEvent<HTMLInputElement>) =>
        setState({
          q: typeof value === "string" ? value : value.target.value,
          page: 0,
        }),
      users: pageList.map((u: any) => ({
        key: u.id,
        name: u.name + (u.lead ? " · líder clínica" : ""),
        contact: u.contact || "",
        role: u.role,
        mods: "",
        org: u.org,
        terr: u.terr,
        status: u.status,
        sc: u.status === "Activo" ? C.alDia : "#8C857C",
        bg: st.sel === u.id ? "#E7FAF5" : "#fff",
        pick: () => open(u),
      })),
      noUsers: !list.length,
      page,
      totalPages,
      pageLabel:
        list.length === 0
          ? "0 usuarios"
          : `${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, list.length)} de ${list.length}`,
      canPrev: page > 0,
      canNext: page < totalPages - 1,
      prevPage: () => setState({ page: Math.max(0, page - 1) }),
      nextPage: () => setState({ page: Math.min(totalPages - 1, page + 1) }),
      goPage: (n: number) => setState({ page: Math.min(Math.max(0, n), totalPages - 1) }),
      newUser: () =>
        setState({
          sel: null,
          err: "",
          f: {
            id: null,
            name: "",
            firstName: "",
            lastName: "",
            contact: "",
            password: "",
            role: "Observador",
            terr: "Todos",
            org: "",
            modules: (A.OBS_DEFAULT_MODULES || []).slice(),
            patientModules: DEFAULT_PATIENT_MODULES.slice(),
            ...emptyPatientFicha(),
          },
        }),
      noForm: !f,
      hasForm: !!f,
      formTitle: isEdit && f ? f.name : "Nuevo usuario",
      formDesc: isPaciente && !isEdit
        ? "Alta de persona acompañada: misma ficha que en campo. Estado inicial: sin evaluación. El cuidador solo se crea aquí si lo indica."
        : isPaciente && isEdit
          ? "Puede añadir cuidador si la persona aún no tiene uno."
          : "Quién entra a QUINTIA, con qué rol y qué puede ver.",
      formSize: isPaciente ? "lg" : "md",
      closeForm: () => setState({ f: null, sel: null, err: "" }),
      f: f || ({} as FormState),
      fSet: {
        name: setF("name"),
        firstName: setF("firstName"),
        lastName: setF("lastName"),
        contact: setF("contact"),
        password: setF("password"),
        birthDate: setF("birthDate"),
        phone: setF("phone"),
        place: setF("place"),
        genero: setF("genero"),
        estadoCivil: setF("estadoCivil"),
        estrato: setF("estrato"),
        tieneCuidador: setF("tieneCuidador"),
        caregiverFirstName: setF("caregiverFirstName"),
        caregiverLastName: setF("caregiverLastName"),
        caregiverBirthDate: setF("caregiverBirthDate"),
        caregiverGenero: setF("caregiverGenero"),
        caregiverEstadoCivil: setF("caregiverEstadoCivil"),
        caregiverEstrato: setF("caregiverEstrato"),
        caregiverPlace: setF("caregiverPlace"),
        caregiverEmail: setF("caregiverEmail"),
        caregiverPhone: setF("caregiverPhone"),
        caregiverPassword: setF("caregiverPassword"),
        role: (e: ChangeEvent<HTMLSelectElement>) => {
          const role = e.target.value;
          const next: FormState = Object.assign({}, f, {
            role,
            personId: isPersonaRole(role) ? f?.personId || "" : "",
            patientModules: DEFAULT_PATIENT_MODULES.slice(),
          }) as FormState;
          if (isPersonaRole(role)) {
            const names = territoryNames(A, S);
            Object.assign(next, emptyPatientFicha(), {
              role: "Persona acompañada",
              password: f?.password || "",
              patientModules: DEFAULT_PATIENT_MODULES.slice(),
              terr: names[0] || f?.terr || "",
            });
          }
          if (role === "Observador") {
            next.modules = (A.OBS_DEFAULT_MODULES || []).slice();
            if (!next.terr) next.terr = "Todos";
          }
          if (isGestorRole(role)) {
            const names = territoryNames(A, S);
            if (!next.terr || /^todos$/i.test(next.terr) || !names.includes(next.terr)) {
              next.terr = names[0] || "";
            }
          }
          if (!isPersonaRole(role)) {
            next.personId = "";
            Object.assign(next, emptyCaregiverFields(), { tieneCuidador: "" });
          }
          setState({ f: next, err: "" });
        },
        terr: setF("terr"),
        org: setF("org"),
      },
      terrOpts: isManualPatient || isExpertoCampo || (isPaciente && isEdit) ? allTerrNames : terrOpts,
      generoOpts: GENERO_OPTS,
      civilOpts: CIVIL_OPTS,
      estratoOpts: ESTRATO_OPTS,
      isObs: !!f && f.role === "Observador",
      isPaciente,
      isManualPatient,
      hasLinkedCaregiver,
      showCaregiverForm,
      canAddCaregiver: !!(isPaciente && !hasLinkedCaregiver),
      fieldsReadonly: false,
      emailEditable: true,
      genPassword: () => {
        if (!f) return;
        const len = Math.max(8, minPasswordLengthForRole(f.role));
        setState({
          f: Object.assign({}, f, { password: generateAccessPassword(len) }),
          err: "",
        });
      },
      genEmail: () => {
        if (!f) return;
        const email = generateConsienteEmail(
          String(f.firstName || ""),
          String(f.lastName || ""),
        );
        if (!email) {
          return setState({
            err: "Escriba nombre y apellido para generar el correo.",
          });
        }
        setState({ f: Object.assign({}, f, { contact: email }), err: "" });
      },
      genCaregiverEmail: () => {
        if (!f) return;
        const email = generateConsienteEmail(
          String(f.caregiverFirstName || ""),
          String(f.caregiverLastName || ""),
        );
        if (!email) {
          return setState({ err: "Escriba nombre y apellido del cuidador para generar el correo." });
        }
        setState({ f: Object.assign({}, f, { caregiverEmail: email }), err: "" });
      },
      genCaregiverPassword: () => {
        if (!f) return;
        setState({
          f: Object.assign({}, f, { caregiverPassword: generateAccessPassword(10) }),
          err: "",
        });
      },
      passwordHint: f
        ? minPasswordLengthForRole(f.role) >= 12
          ? "Mínimo 12 caracteres (Administrador / Clínica)"
          : "Mínimo 8 caracteres"
        : "Mínimo 8 caracteres",
      hasErr: !!st.err,
      err: st.err,
      clearErr: () => setState({ err: "" }),
      save,
      saveLabel: isEdit ? "Guardar cambios" : "Crear",
      isEdit,
      statusLabel: f && f.status === "Activo" ? "Desactivar usuario" : "Activar usuario",
      // SPEC-01 FR-01.3: el admin genera una clave temporal de 6 dígitos (24 h) para otra cuenta.
      canReset: !!(isEdit && f && f.id && (f as { roleId?: string }).roleId !== "admin" && f.role !== "Administrador" && f.role !== "Administradora"),
      tempMsg: (st as { tempMsg?: string }).tempMsg || "",
      clearTempMsg: () => setState({ tempMsg: "" } as never),
      resetPassword: async () => {
        if (!f || !f.id) return;
        try {
          const res = await fetch("/api/auth/assisted-reset", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: f.id }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setState({ err: data.error || "No se pudo restablecer la clave." });
            return;
          }
          const vence = new Date(Number(data.expiresAt)).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" });
          setState({ tempMsg: `Clave temporal: ${data.tempPassword} · vence ${vence}. Díctesela a la persona; no la envíe por WhatsApp.` } as never);
        } catch {
          setState({ err: "No se pudo conectar. Intente de nuevo." });
        }
      },
      toggleStatus: async () => {
        if (!f || !f.id) return;
        const nv = f.status === "Activo" ? "Inactivo" : "Activo";
        try {
          const res = await fetch("/api/accounts", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: f.id,
              name: f.name,
              contact: f.contact,
              email: f.contact,
              role: f.role,
              terr: f.terr,
              org: f.org,
              modules: f.modules,
              status: nv,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setState({ err: data.error || "No se pudo cambiar el estado." });
            return;
          }
          const acc = data.account;
          A.set((s: any) => {
            const list = Array.isArray(s.accounts) ? s.accounts.slice() : [];
            const i = list.findIndex((x: any) => x.id === acc.id);
            if (i >= 0) list[i] = { ...list[i], ...acc };
            else list.push(acc);
            s.accounts = list;
            if (isGestorRole(acc.role) || acc.roleId === "experto") {
              s.expertOv = s.expertOv || {};
              s.expertOv[acc.name] = Object.assign({}, s.expertOv[acc.name], {
                active: nv === "Activo",
              });
            }
            A.logActivity(
              s,
              A.session()?.id || "admin",
              (nv === "Activo" ? "Activó" : "Desactivó") + " a " + acc.name,
            );
          });
          setState({
            f: Object.assign({}, f, { status: nv }),
            err: "",
            msg: f.name + (nv === "Activo" ? " puede ingresar." : " ya no puede ingresar."),
          });
        } catch {
          setState({ err: "No se pudo conectar con la base de datos." });
        }
      },
      activity: act.map((a: any, i: number) => ({
        key: a.at + "-" + i,
        when: A.agoText(a.at),
        text: a.text,
      })),
      noActivity: !act.length,
    };
  }, [A, router, setState, st, live]);

  return { v };
}
