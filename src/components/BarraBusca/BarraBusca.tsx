import type { ReactNode } from 'react';
import "./BarraBusca.css";
import Botao from "../Botao/Botao";

type BuscaProps = {
  placeholder?: string;
  type?: "text";
  style?: React.CSSProperties;
  icon?: ReactNode;
  value?: string;
  onChange: (value: string) => void;
};

export default function BarraBusca({
    placeholder,
    type,
    style,
    icon,
    value,
    onChange
}: BuscaProps) {
    return (
        <div className="barra-busca" style={style}>
            <div className="icone-busca">
                {icon}
            </div>

            <input 
                type={type} 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder || "Buscar..."} 
                id="input-busca" 
            />
            
            {/* Funcionalidade pendente */}
            <Botao 
                size="md"
                fullWidth
                style={{ height: "100%", padding: "0 40px", borderRadius: "0 0.5rem 0.5rem 0" }}
            >
                Adicionar Filtro
            </Botao>
        </div>
    );
}