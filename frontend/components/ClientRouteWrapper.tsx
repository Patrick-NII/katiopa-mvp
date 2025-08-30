"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"

type Props = {
  children: ReactNode
}

// Wraps children with a class that scopes global Fredoka styling
// to all routes except the homepage (/).
export default function ClientRouteWrapper({ children }: Props) {
  const pathname = usePathname()
  const isHome = pathname === "/"

  return <div className={isHome ? undefined : "fredoka-scope"}>{children}</div>
}

