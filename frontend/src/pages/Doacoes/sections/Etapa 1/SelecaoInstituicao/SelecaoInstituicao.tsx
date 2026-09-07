import BarraBusca from "../../../../../components/BarraBusca/BarraBusca";
import "./SelecaoInstituicao.css";

const Search = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} fill="#ffffff" viewBox="0 0 256 256"><path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z"></path></svg>
);

type SelecaoInstituicaoProps = {
    termoBusca: string;
    setTermoBusca: (valor: string) => void;
};

export default function SelecaoInstituicao({ 
    termoBusca, 
    setTermoBusca,  
}: SelecaoInstituicaoProps) {
    return (
        <div className="selecao-instituicao">
            <h2>Qual instituição você deseja ajudar?</h2>
            <p>Encontre a Instituição que mais se conecta com sua causa.</p>
            <BarraBusca 
                placeholder="Buscar Instituição..." 
                icon={<Search size={24} />} 
                value={termoBusca}
                onChange={setTermoBusca}
            />
        </div>
    );
}