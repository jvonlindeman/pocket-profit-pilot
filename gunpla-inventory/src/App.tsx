import { Toaster } from "sonner";
import { GunplaInventoryPage } from "./features/gunpla-inventory";

const App = () => (
  <>
    <GunplaInventoryPage />
    <Toaster richColors position="top-right" theme="system" />
  </>
);

export default App;
