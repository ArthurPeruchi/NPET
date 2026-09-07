import "./Botao.css";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type BotaoProps = {
  variant?: "primario" | "secundario";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  children?: ReactNode;
  style?: React.CSSProperties;
  className?: string;
  to?: string;
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
  className,
  to
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

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        style={style}
        aria-disabled={disabled}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
      >
        {icon && <span className="botao-icone">{icon}</span>}
        {children}
      </Link>
    );
  }

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