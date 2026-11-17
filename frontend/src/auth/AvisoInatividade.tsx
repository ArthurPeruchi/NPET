import ModalConfirmacao from "../components/ModalConfirmacao/ModalConfirmacao";

type AvisoInatividadeProps = {
    segundos_restantes: number;
    on_continue: () => void;
    on_logout: () => void;
};

// "3 minutos", "2 minutos", "1 minuto" e, no último minuto, a contagem em segundos.
function format_remaining(seconds: number): string {
    if (seconds <= 60) return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
}

export default function AvisoInatividade({ segundos_restantes, on_continue, on_logout }: AvisoInatividadeProps) {
    return (
        <ModalConfirmacao
            title="Sua sessão vai expirar"
            primary_label="Continuar conectado"
            on_primary={on_continue}
            secondary_label="Sair agora"
            on_secondary={on_logout}
            on_dismiss={on_continue}
        >
            <p className="modal-confirmacao-destaque">
                Sua sessão expira em {format_remaining(segundos_restantes)}.
            </p>
            <p>Por segurança, desconectamos quem fica 15 minutos sem usar o site.</p>
        </ModalConfirmacao>
    );
}