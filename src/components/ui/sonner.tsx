import { Toaster as Sonner, type ToasterProps } from "sonner"

// Light-only app: theme fixed, no next-themes provider needed.
const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    position="bottom-center"
    toastOptions={{ style: { background: "#1B2F5E", color: "#fff", border: "none", fontWeight: 600 } }}
    {...props}
  />
)

export { Toaster }
