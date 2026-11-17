// Evento que sinaliza "o usuário ainda está aqui" sem depender de mouse ou teclado.
export const ACTIVITY_EVENT = "npet:atividade";

export function notify_activity(): void {
    window.dispatchEvent(new Event(ACTIVITY_EVENT));
}