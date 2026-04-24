import { useEffect } from "react";

import { MolecularScene } from "@/components/molecular";
import { LeftSidebar, ActivityBar } from "@/components/left-sidebar";
import { ProteinDetailsSidebar } from "@/components/right-sidebar/ProteinDetailsSidebar";
import { FastaBar } from "@/components/fasta-bar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MenuBar } from "@/components/navigation/FloatingNavbar";
import { DropZoneOverlay } from "@/components/workspace/DropZoneOverlay";
import { Toaster } from "@/components/ui/sonner";
import { useAuthStore } from "./stores/useAuthStore";
import { useLayoutStore } from "./stores/useLayoutStore";
import { useViewerConfigStore } from "./stores/useViewerConfigStore";
import { initGoogleIdentity } from "./lib/googleDriveService";
import { useDeepLinkRestore } from "./hooks/useDeepLinkRestore";
import { useFileDrop } from "./hooks/useFileDrop";

export default function App() {
	const { initializeAuth } = useAuthStore();
	const darkMode = useLayoutStore((s) => s.darkMode);
	const viewerBackground = useViewerConfigStore((s) => s.viewerBackground);
	const handleFilesDropped = useFileDrop();

	useDeepLinkRestore();

	useEffect(() => {
		const unsubscribe = initializeAuth();

		const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
			| string
			| undefined;
		if (clientId) {
			initGoogleIdentity(clientId);
		}

		return () => unsubscribe();
	}, [initializeAuth]);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode);
	}, [darkMode]);

	return (
		<>
			<SidebarProvider
				defaultOpen={true}
				style={
					{
						"--sidebar-width": "22rem",
						"--left-sidebar-width": "22rem",
					} as React.CSSProperties
				}
				className="flex h-screen w-full flex-col overflow-hidden bg-[#18181b]"
			>
				<header className="h-9 flex-shrink-0">
					<MenuBar />
				</header>

				<div className="flex min-h-0 flex-1">
					<ActivityBar />
					<div
						style={{ contain: "layout paint" }}
						className="relative h-full min-w-0 flex-1 overflow-clip"
					>
						<LeftSidebar />

						<SidebarInset
							className="relative flex h-full w-full flex-col"
							style={{ backgroundColor: viewerBackground }}
						>
							<ProteinDetailsSidebar>
								<div
									className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
									style={{ backgroundColor: viewerBackground }}
								>
									<FastaBar />
									<div className="relative min-h-0 w-full flex-1 overflow-hidden">
										<DropZoneOverlay onFilesDropped={handleFilesDropped}>
											<MolecularScene background={viewerBackground} />
										</DropZoneOverlay>
									</div>
								</div>
							</ProteinDetailsSidebar>
						</SidebarInset>
					</div>
				</div>
			</SidebarProvider>
			<Toaster />
		</>
	);
}
