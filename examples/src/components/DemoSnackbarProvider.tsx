import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert, Snackbar } from "@mui/material";

interface Notice {
  id: number;
  message: string;
}

const DemoSnackbarContext = createContext<(message: string) => void>(() => {});

export function useDemoSnackbar() {
  return useContext(DemoSnackbarContext);
}

export default function DemoSnackbarProvider({
  children,
}: PropsWithChildren) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const nextId = useRef(0);
  const notify = useCallback((message: string) => {
    nextId.current += 1;
    const notice = { id: nextId.current, message };
    setNotices((current) => [...current, notice]);
  }, []);
  const dismiss = useCallback(() => {
    setNotices((current) => current.slice(1));
  }, []);
  const activeNotice = notices[0];

  return (
    <DemoSnackbarContext.Provider value={notify}>
      {children}
      {activeNotice && (
        <Snackbar
          key={activeNotice.id}
          open
          autoHideDuration={5000}
          onClose={dismiss}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity="info" variant="filled" onClose={dismiss}>
            {activeNotice.message}
          </Alert>
        </Snackbar>
      )}
    </DemoSnackbarContext.Provider>
  );
}
