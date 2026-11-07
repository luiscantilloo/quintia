import Swal, { type SweetAlertIcon, type SweetAlertResult } from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

export type NaraAlertAction = {
  label: string;
  go: () => void;
};

export type NaraAlertOptions = {
  icon?: SweetAlertIcon;
  title?: string;
};

const BASE = {
  buttonsStyling: false,
  reverseButtons: true,
  focusConfirm: true,
  customClass: {
    popup: "nara-swal-popup",
    title: "nara-swal-title",
    htmlContainer: "nara-swal-html",
    actions: "nara-swal-actions",
    confirmButton: "nara-swal-confirm",
    denyButton: "nara-swal-deny",
    cancelButton: "nara-swal-cancel",
  },
} as const;

function guessIcon(msg: string): SweetAlertIcon {
  const m = msg.toLowerCase();
  if (
    /faltan|error|escriba|confirme|no válido|no es válido|exige|rechaz|bloquead|ya existe|elige|elija/
      .test(m)
  ) {
    return "warning";
  }
  if (
    /enviad|guardad|cread|asignad|aprob|éxito|listo|marcado|actualiz|activad|desactiv|fijad|quitad|agregad|compartid|reanud|pausa/
      .test(m)
  ) {
    return "success";
  }
  return "info";
}

/** Alerta / confirmación QUINTIA con SweetAlert2. */
export function naraAlert(
  msg: string,
  actions: NaraAlertAction[] = [],
  opts: NaraAlertOptions = {},
): Promise<SweetAlertResult> {
  const a0 = actions[0];
  const a1 = actions[1];
  return Swal.fire({
    ...BASE,
    icon: opts.icon || guessIcon(msg),
    title: opts.title,
    text: msg,
    confirmButtonText: a0?.label || "Entendido",
    showDenyButton: !!a1,
    denyButtonText: a1?.label || "",
    showCancelButton: !!a0,
    cancelButtonText: "Cerrar",
  }).then((result) => {
    if (result.isConfirmed && a0) a0.go();
    else if (result.isDenied && a1) a1.go();
    return result;
  });
}
