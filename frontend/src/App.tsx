import { Toaster } from "sonner"
import "./App.css"

import { DesignExplorerExperience } from "@/features/design-explorer/DesignExplorerExperience"

function App() {
  return (
    <>
      <DesignExplorerExperience />
      <Toaster position="top-right" />
    </>
  )
}

export default App
