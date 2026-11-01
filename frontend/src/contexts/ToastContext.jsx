import { createContext, useCallback, useContext, useRef, useState } from "react";

// Mensagem curta no rodapé da tela (ex.: "Compra confirmada", "Assento indisponível")
const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [mensagem, setMensagem] = useState("");
  const [visivel, setVisivel] = useState(false);
  const timer = useRef();

  const toast = useCallback((texto) => {
    setMensagem(texto);
    setVisivel(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisivel(false), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast${visivel ? " show" : ""}`} id="toast" role="status" aria-live="polite">
        {mensagem}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
