import { useState } from "react";
import { extractProteinQuery } from "../../../ai/geminiClient";
import {
	searchCatalogProteins,
	getCatalogProteinDetail,
} from "../../../lib/apiClient";
import { searchUniprotFasta } from "../../../lib/uniprotClient";

export function useProteinSearch({ load, onProteinLoaded }) {
	const [loadingProtein, setLoadingProtein] = useState(false);

	const handleFastaLoad = async (
		fastaInput,
		{ validateFasta, setNotice, setChatInput },
	) => {
		const validation = validateFasta(fastaInput);
		if (!validation.valid) {
			setNotice({
				tone: "error",
				message: validation.reason ?? "Secuencia FASTA no válida.",
			});
			return;
		}

		setChatInput("");
		setNotice({
			tone: "info",
			message: "Enviando FASTA a la API y cargando la proteína en el portal...",
		});
		setLoadingProtein(true);

		try {
			const proteinId = await load(fastaInput);
			if (!proteinId)
				throw new Error("La carga no devolvió una proteína válida.");
			onProteinLoaded(proteinId);
			setNotice({
				tone: "success",
				message:
					"Proteína cargada correctamente. Ya debería aparecer en el portal.",
			});
		} catch (err) {
			setNotice({
				tone: "error",
				message: err?.message ?? "Error al procesar la secuencia FASTA.",
			});
		} finally {
			setLoadingProtein(false);
		}
	};

	const handleProteinSearch = async (
		userMessage,
		{ setNotice, setChatInput, pushMessage, streamChatReply },
	) => {
		setChatInput("");
		pushMessage({ role: "user", content: userMessage });
		setLoadingProtein(true);

		try {
			setNotice({ tone: "info", message: "Identificando proteína..." });
			const proteinQuery = await extractProteinQuery(userMessage);

			if (!proteinQuery) {
				setLoadingProtein(false);
				setNotice(null);
				await streamChatReply(userMessage);
				return;
			}

			let fasta = null;
			setNotice({
				tone: "info",
				message: `Buscando "${proteinQuery}" en el catálogo...`,
			});
			try {
				const results = await searchCatalogProteins({ search: proteinQuery });
				if (results.length > 0) {
					const detail = await getCatalogProteinDetail(results[0].proteinId);
					if (detail?.fastaReady) fasta = detail.fastaReady;
				}
			} catch {
				// Catalog unavailable — fall through to UniProt
			}

			if (!fasta) {
				setNotice({
					tone: "info",
					message: `Buscando "${proteinQuery}" en UniProt...`,
				});
				fasta = await searchUniprotFasta(proteinQuery);
			}

			setNotice({
				tone: "info",
				message: "Secuencia encontrada. Enviando a la API...",
			});
			const proteinId = await load(fasta);
			if (!proteinId)
				throw new Error("La API no devolvió una proteína válida.");

			onProteinLoaded(proteinId);
			setNotice({
				tone: "success",
				message: "Proteína cargada correctamente. Ya aparece en el portal.",
			});
			pushMessage({
				role: "ai",
				content: `He encontrado la secuencia FASTA de "${proteinQuery}" y la he cargado en el portal. ¡Ya puedes verla!`,
			});
		} catch (err) {
			const msg = err?.message ?? "No pude encontrar o cargar la proteína.";
			setNotice({ tone: "error", message: msg });
			pushMessage({ role: "ai", content: msg });
		} finally {
			setLoadingProtein(false);
		}
	};

	return { loadingProtein, handleFastaLoad, handleProteinSearch };
}
