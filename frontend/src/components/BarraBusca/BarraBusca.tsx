import type { ReactNode } from 'react';
import "./BarraBusca.css";
import Botao from "../Botao/Botao";
import useIsMobile from '../../hooks/useIsMobile';

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
    const isMobile = useIsMobile();

    return (
        <div className="barra-busca" style={style}>
            <div className="icone-busca">
                {icon}
            </div>

            <input 
                type={type} 
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={isMobile ? "Buscar..." : placeholder} 
                id="input-busca" 
            />
            
            {isMobile && (
                <div className="mobile-filtro">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="#f5f5f5" viewBox="0 0 256 256">
                        <path d="M227.81,66.76l-.08.09L160,139.17v55.49A16,16,0,0,1,152.87,208l-32,21.34A16,16,0,0,1,96,216V139.17L28.27,66.85l-.08-.09A16,16,0,0,1,40,40H216a16,16,0,0,1,11.84,26.76Z"></path>
                    </svg>
                </div>
            )}

            {!isMobile && (
            <Botao 
                size="md"
                fullWidth
                style={{ height: "100%", padding: "0 40px", borderRadius: "0 0.5rem 0.5rem 0" }}
                className="btn-adicionar-filtro"
            >
                Adicionar Filtro
            </Botao>
            )}
        </div>
    );
}