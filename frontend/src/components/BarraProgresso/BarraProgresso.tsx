import "./BarraProgresso.css";

type Passo = {
  id: number;
  label: string;
  icon: React.ReactNode;
};

type BarraProgressoProps = {
  passoAtual: 1 | 2 | 3 | 4; // 1 = Instituição, 2 = Tipo, 3 = Detalhes, 4 = Confirmação
  onPassoClick: (passo: 1 | 2 | 3 | 4) => void;
};

function IconeInstituicao({ cor }: { cor: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill={cor} viewBox="0 0 256 256"><path d="M232,224H208V32h8a8,8,0,0,0,0-16H40a8,8,0,0,0,0,16h8V224H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16ZM64,32H192V224H160V184a8,8,0,0,0-8-8H104a8,8,0,0,0-8,8v40H64Zm80,192H112V192h32ZM88,64a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,64Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,64ZM88,104a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,104Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,104ZM88,144a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H96A8,8,0,0,1,88,144Zm48,0a8,8,0,0,1,8-8h16a8,8,0,0,1,0,16H144A8,8,0,0,1,136,144Z"></path></svg>
  );
}

function IconeTipo({ cor }: { cor: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill={cor} viewBox="0 0 256 256"><path d="M230.33,141.06a24.34,24.34,0,0,0-18.61-4.77C230.5,117.33,240,98.48,240,80c0-26.47-21.29-48-47.46-48A47.58,47.58,0,0,0,156,48.75,47.58,47.58,0,0,0,119.46,32C93.29,32,72,53.53,72,80c0,11,3.24,21.69,10.06,33a31.87,31.87,0,0,0-14.75,8.4L44.69,144H16A16,16,0,0,0,0,160v40a16,16,0,0,0,16,16H120a7.93,7.93,0,0,0,1.94-.24l64-16a6.94,6.94,0,0,0,1.19-.4L226,182.82l.44-.2a24.6,24.6,0,0,0,3.93-41.56ZM119.46,48A31.15,31.15,0,0,1,148.6,67a8,8,0,0,0,14.8,0,31.15,31.15,0,0,1,29.14-19C209.59,48,224,62.65,224,80c0,19.51-15.79,41.58-45.66,63.9l-11.09,2.55A28,28,0,0,0,140,112H100.68C92.05,100.36,88,90.12,88,80,88,62.65,102.41,48,119.46,48ZM16,160H40v40H16Zm203.43,8.21-38,16.18L119,200H56V155.31l22.63-22.62A15.86,15.86,0,0,1,89.94,128H140a12,12,0,0,1,0,24H112a8,8,0,0,0,0,16h32a8.32,8.32,0,0,0,1.79-.2l67-15.41.31-.08a8.6,8.6,0,0,1,6.3,15.9Z"></path></svg>
  );
}

function IconeDetalhes({ cor }: { cor: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill={cor} viewBox="0 0 256 256"><path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z"></path></svg>
  );
}

function IconeConfirmacao({ cor }: { cor: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill={cor} viewBox="0 0 256 256"><path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"></path></svg>
  );
}

const PASSOS: Passo[] = [
  {
    id: 1,
    label: "Instituição",
    icon: (cor: string) => <IconeInstituicao cor={cor} />,
  },
  {
    id: 2,
    label: "Tipo",
    icon: (cor: string) => <IconeTipo cor={cor} />,
  },
  {
    id: 3,
    label: "Detalhes",
    icon: (cor: string) => <IconeDetalhes cor={cor} />,
  },
  {
    id: 4,
    label: "Confirmação",
    icon: (cor: string) => <IconeConfirmacao cor={cor} />,
  },
] as any;

export default function BarraProgresso({ 
  passoAtual, 
  onPassoClick 
}: BarraProgressoProps) {
  return (
    <nav
      className="barra-progresso"
      aria-label={`Passo ${passoAtual} de ${PASSOS.length}`}
    >
      {PASSOS.map((passo, index) => {
        const concluido = passo.id < passoAtual;
        const ativo     = passo.id === passoAtual;

        const estadoClasse = concluido
          ? "passo--concluido"
          : ativo
          ? "passo--ativo"
          : "passo--futuro";

        const corIcone = ativo
          ? "var(--main-color)"           // verde no ativo
          : concluido
          ? "#FFFFFF"                   // branco no concluído (fundo cinza)
          : "#AAAAAA";                  // cinza no futuro

        function handlePassoClick() {
          if (concluido) {
            onPassoClick(passo.id as 1 | 2 | 3 | 4);
          }
        };

        return (
          <div key={passo.id} className="passo-wrap">
            {index > 0 && (
              <div
                className={`linha-conectora ${concluido || ativo ? "linha-conectora--preenchida" : ""}`}
                aria-hidden="true"
              />
            )}

            <div
              className={`passo ${estadoClasse}`}
              role="listitem"
              aria-current={ativo ? "step" : undefined}
              aria-label={`${ativo ? "Atual: " : concluido ? "Concluído: " : ""}Passo ${passo.id}, ${passo.label}`}
              onClick={handlePassoClick}
            >
              {(passo as any).icon(corIcone)}
            </div>
          </div>
        );
      })}
    </nav>
  );
}