import * as React from "react"
import { cn } from "../../lib/utils"

const Sidebar = React.forwardRef(({ className, children, ...props }, ref) => (
  <aside
    ref={ref}
    className={cn(
      "fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r bg-white/80 backdrop-blur-xl transition-transform",
      className
    )}
    {...props}
  >
    {children}
  </aside>
))
Sidebar.displayName = "Sidebar"

const SidebarHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex h-14 items-center border-b px-4", className)} {...props} />
))
SidebarHeader.displayName = "SidebarHeader"

const SidebarContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex-1 overflow-auto py-2", className)} {...props} />
))
SidebarContent.displayName = "SidebarContent"

const SidebarGroup = React.forwardRef(({ className, title, children, ...props }, ref) => (
  <div ref={ref} className={cn("px-4 py-2", className)} {...props}>
    {title && <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</h4>}
    <div className="space-y-1">{children}</div>
  </div>
))
SidebarGroup.displayName = "SidebarGroup"

const SidebarFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("border-t p-4", className)} {...props} />
))
SidebarFooter.displayName = "SidebarFooter"

export { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarFooter }
