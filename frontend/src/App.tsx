import { Toaster } from "sonner"
import "./App.css"

import { DesignExplorerExperience } from "@/features/design-explorer/DesignExplorerExperience"

function App() {
  return (
    <div className="flex min-h-screen w-screen">
      <DesignExplorerExperience />
      <Toaster position="top-right" />
    </div>
  )
}

export default App
