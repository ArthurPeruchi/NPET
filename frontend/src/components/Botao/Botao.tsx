import "./Botao.css";
import type { ReactNode } from "react";

type BotaoProps = {
  variant?: "primario" | "secundario";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: null;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
};

export default function Botao({
  variant = "primario",
  size = "md",
  disabled = false,
  fullWidth = false,
  icon = null,
  type = "button",
  onClick, 
  children,
  style,
  className
}: BotaoProps) {
  const classes = [
    "botao",
    `botao--${variant}`,
    `botao--size-${size}`,
    disabled ? "botao--disabled" : "",
    fullWidth ? "botao--full-width" : "",
    icon ? "botao--com-icone" : "",
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled}
      type={type}
      onClick={onClick}
      style={style}
    >
      {icon && <span className="botao-icone">{icon}</span>}
      {children}
    </button>
  );
}