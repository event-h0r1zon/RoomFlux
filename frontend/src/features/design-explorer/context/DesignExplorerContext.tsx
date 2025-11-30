import type { ReactNode } from "react"
import { createContext, useContext } from "react"

import { useDesignExplorerSession } from "../sessions/useDesignExplorerSession"

const DesignExplorerContext = createContext<ReturnType<typeof useDesignExplorerSession> | null>(
  null
)

interface DesignExplorerProviderProps {
  children: ReactNode
}

export function DesignExplorerProvider({ children }: DesignExplorerProviderProps) {
  const value = useDesignExplorerSession()
  return (
    <DesignExplorerContext.Provider value={value}>
      {children}
    </DesignExplorerContext.Provider>
  )
}

export function useDesignExplorer() {
  const context = useContext(DesignExplorerContext)
  if (!context) {
    throw new Error("useDesignExplorer must be used within DesignExplorerProvider")
  }
  return context
}
