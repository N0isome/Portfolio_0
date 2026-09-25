import { $, esc, read, save, dialog, dateISO, validDate } from "./common.js";
const key = "nc-agenda-v2",
  professionals = ["Dra. Salas", "Dr. Rojas"],
  states = ["Pendiente", "Confirmada", "Cancelada"];
const minutes = (s) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
const validAppointment = (a) =>
  a &&
  typeof a.id === "string" &&
  typeof a.patient === "string" &&
  a.patient.length > 0 &&
  a.patient.length <= 80 &&
  typeof a.reason === "string" &&
  a.reason.length <= 200 &&
  professionals.includes(a.professional) &&
  states.includes(a.state) &&
  validDate(a.date) &&
  /^\d{2}:\d{2}$/.test(a.time) &&
  Number(a.time.slice(3)) < 60 &&
  minutes(a.time) >= 480 &&
  [30, 60, 90].includes(a.duration) &&
  minutes(a.time) + a.duration <= 1140;
const monday = (d) => {
  d = new Date(d);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};
let week = monday(new Date()),
  editing = null;
const seed = [
  {
    id: "sample-a",
    date: dateISO(week),
    time: "09:00",
    duration: 60,
    patient: "Paciente de ejemplo A",
    professional: "Dra. Salas",
    reason: "Control ficticio",
    state: "Confirmada",
  },
  {
    id: "sample-b",
    date: dateISO(week),
    time: "11:00",
    duration: 30,
    patient: "Paciente de ejemplo B",
    professional: "Dr. Rojas",
    reason: "Consulta ficticia",
    state: "Pendiente",
  },
];
let appointments = read(
  key,
  seed,
  (x) =>
    Array.isArray(x) &&
    x.length < 2000 &&
    x.every(validAppointment) &&
    new Set(x.map((a) => a.id)).size === x.length,
);
const modal = dialog("appointment", "Nueva reserva");
$(".dialog-body", modal).innerHTML =
  `<form id="appointment-form"><p class="small">Entorno de práctica: usa solamente información ficticia.</p><div class="fields"><label class="wide">Paciente ficticio<input id="patient" maxlength="80" required></label><label>Profesional<select id="professional">${professionals.map((p) => `<option>${p}</option>`).join("")}</select></label><label>Estado<select id="appointment-state">${states.map((s) => `<option>${s}</option>`).join("")}</select></label><label>Fecha<input id="appointment-date" type="date" required></label><label>Hora<input id="appointment-time" type="time" min="08:00" max="18:30" step="1800" required></label><label>Duración<select id="duration"><option value="30">30 minutos</option><option value="60">60 minutos</option><option value="90">90 minutos</option></select></label><label class="wide">Motivo ficticio<input id="reason" maxlength="200" required></label></div><p class="status" id="appointment-error" role="alert"></p><div class="dialog-actions"><button class="btn danger" type="button" id="remove-appointment">Eliminar reserva</button><button class="btn primary" type="submit">Guardar reserva local</button></div></form>`;
const format = (d) =>
  new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(
    d,
  );
function render() {
  const end = new Date(week);
  end.setDate(end.getDate() + 6);
  $("#week-label").textContent =
    `${format(week)} — ${format(end)} · ${end.getFullYear()}`;
  const startISO = dateISO(week),
    endISO = dateISO(end);
  const current = appointments.filter(
    (a) => a.date >= startISO && a.date <= endISO,
  );
  $("#week-count").textContent = current.length;
  $("#confirmed-count").textContent = current.filter(
    (a) => a.state === "Confirmada",
  ).length;
  $("#week-list").innerHTML = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(week);
    d.setDate(d.getDate() + i);
    const iso = dateISO(d);
    const items = current
      .filter(
        (a) =>
          a.date === iso &&
          ($("#professional-filter").value === "all" ||
            a.professional === $("#professional-filter").value) &&
          ($("#state-filter").value === "all" ||
            a.state === $("#state-filter").value),
      )
      .sort((a, b) => a.time.localeCompare(b.time));
    return `<section class="day"><h3>${new Intl.DateTimeFormat("es-CL", { weekday: "long", day: "numeric", month: "short" }).format(d)}</h3>${items.length ? items.map((a) => `<button class="appointment" data-edit="${esc(a.id)}" data-state="${a.state}"><strong>${a.time} · ${a.duration} min</strong><span>${esc(a.patient)}</span><small>${a.professional} · ${a.state}</small></button>`).join("") : '<p class="day-empty">Sin reservas para este filtro.</p>'}<button class="btn" data-date="${iso}">+ Reservar</button></section>`;
  }).join("");
}
function open(a = null, date = dateISO(week)) {
  editing = a?.id || null;
  $("#appointment-title").textContent = a ? "Editar reserva" : "Nueva reserva";
  $("#patient").value = a?.patient || "";
  $("#reason").value = a?.reason || "";
  $("#professional").value =
    a?.professional ||
    ($("#professional-filter").value === "all"
      ? professionals[0]
      : $("#professional-filter").value);
  $("#appointment-state").value = a?.state || states[0];
  $("#appointment-date").value = a?.date || date;
  $("#appointment-time").value = a?.time || "09:00";
  $("#duration").value = a?.duration || 30;
  $("#remove-appointment").hidden = !a;
  $("#appointment-error").textContent = "";
  modal.showModal();
}
$("#appointment-form").onsubmit = (e) => {
  e.preventDefault();
  const a = {
    id: editing || crypto.randomUUID(),
    patient: $("#patient").value.trim(),
    professional: $("#professional").value,
    state: $("#appointment-state").value,
    date: $("#appointment-date").value,
    time: $("#appointment-time").value,
    duration: Number($("#duration").value),
    reason: $("#reason").value.trim(),
  };
  const error = $("#appointment-error");
  if (!validAppointment(a) || !a.reason) {
    error.textContent =
      "Completa los datos. Horario de atención: 08:00 a 19:00, incluyendo la duración.";
    return;
  }
  const start = minutes(a.time),
    end = start + a.duration;
  const collision =
    a.state !== "Cancelada" &&
    appointments.some(
      (x) =>
        x.id !== a.id &&
        x.state !== "Cancelada" &&
        x.professional === a.professional &&
        x.date === a.date &&
        start < minutes(x.time) + x.duration &&
        end > minutes(x.time),
    );
  if (collision) {
    error.textContent =
      "Ese profesional ya tiene una reserva que se cruza con este horario.";
    return;
  }
  appointments = editing
    ? appointments.map((x) => (x.id === editing ? a : x))
    : [...appointments, a];
  const stored = save(key, appointments);
  week = monday(new Date(a.date + "T12:00:00"));
  modal.close();
  render();
  $("#agenda-status").textContent = stored
    ? "Reserva guardada en este navegador. No se envió una confirmación real."
    : "Reserva disponible solo en esta sesión.";
};
$("#remove-appointment").onclick = () => {
  const id = editing;
  const deleted = appointments.find((a) => a.id === id);
  appointments = appointments.filter((a) => a.id !== id);
  save(key, appointments);
  modal.close();
  render();
  $("#agenda-status").innerHTML =
    'Reserva eliminada. <button class="btn" id="undo-delete">Deshacer</button>';
  $("#undo-delete").onclick = () => {
    appointments.push(deleted);
    save(key, appointments);
    render();
    $("#agenda-status").textContent = "Reserva restaurada.";
  };
};
$("#new-appointment").onclick = () => open();
$("#week-list").onclick = (e) => {
  const b = e.target.closest("button");
  if (b?.dataset.date) open(null, b.dataset.date);
  if (b?.dataset.edit) open(appointments.find((a) => a.id === b.dataset.edit));
};
$("#previous").onclick = () => {
  week.setDate(week.getDate() - 7);
  render();
};
$("#next").onclick = () => {
  week.setDate(week.getDate() + 7);
  render();
};
$("#today").onclick = () => {
  week = monday(new Date());
  render();
};
$("#professional-filter").onchange = render;
$("#state-filter").onchange = render;
render();
