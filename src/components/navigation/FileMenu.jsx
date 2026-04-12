import React, { useRef, useState, useCallback } from 'react'
import {
  MenubarMenu,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarSeparator,
  MenubarTrigger,
} from "../ui/menubar"
import { toast } from 'sonner'
import { useProteinStore } from '../../stores/useProteinStore'
import { useMolstarStore } from '../../stores/useMolstarStore'
import { useUIStore } from '../../stores/useUIStore'
import { parseStructureFile, readTextFile } from '../../lib/importStructure'
import { fetchStructureById, fetchMetadataById } from '../../lib/rcsbClient'
import { exportViewerImage } from '../../lib/exportImage'
import { exportProteinPdf } from '../../lib/exportPdf'
import { ExportImageDialog } from '../workspace/ExportImageDialog'
import { ImportRcsbDialog } from '../workspace/ImportRcsbDialog'
import { serializeViewerState, buildShareUrl } from '../../utils/deepLink'

const downloadBlob = (content, filename, mime) => {
  if (!content) return
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function FileMenu() {
  const { proteinsById, upsertProtein, setActiveProteinId, selectedProteinIds } = useProteinStore();

  const fileInputRef = useRef(null)
  const [exportImageOpen, setExportImageOpen] = useState(false)
  const [rcsbOpen, setRcsbOpen] = useState(false)

  const itemClass = "text-xs text-slate-300 hover:bg-white/10 focus:bg-white/10 hover:text-white focus:text-white rounded-lg px-2 py-1.5 cursor-pointer flex justify-between items-center"
  const labelClass = "px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500"
  const separatorClass = "bg-white/10 mx-1 my-1"
  const contentClass = "w-[360px] bg-[#111113] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-1.5"

  const handleImportLocal = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    try {
      const text = await readTextFile(file)
      const protein = parseStructureFile(text, file.name)
      upsertProtein(protein)
      setActiveProteinId(protein.id)
    } catch (err) {
      alert(`Error al importar archivo: ${err.message}`)
    }
  }, [upsertProtein, setActiveProteinId])

  const handleRcsbImport = useCallback(async (pdbId, format) => {
    const { text, format: actualFormat } = await fetchStructureById(pdbId, format)
    const protein = parseStructureFile(text, `${pdbId}.${format === 'cif' ? 'cif' : 'pdb'}`)
    protein.pdbId = pdbId.toLowerCase()
    protein.name = protein.name === pdbId ? (await fetchMetadataById(pdbId)).title : protein.name
    upsertProtein(protein)
    setActiveProteinId(protein.id)
  }, [upsertProtein, setActiveProteinId])

  const handleExportPdb = useCallback(() => {
    const id = selectedProteinIds[0]
    if (!id) return
    const protein = proteinsById[id]
    const pdbFile = protein?._raw?.structural_data?.pdb_file ?? protein?.pdbData ?? protein?.structureData
    if (!pdbFile) { alert('No hay datos estructurales para exportar.'); return }
    const name = (protein?.name || 'protein').replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()
    downloadBlob(pdbFile, `${name}.pdb`, 'chemical/x-pdb')
  }, [selectedProteinIds, proteinsById])

  const handleExportFasta = useCallback(() => {
    const id = selectedProteinIds[0]
    if (!id) return
    const protein = proteinsById[id]
    const seq = protein?.sequence
    if (!seq) { alert('No hay secuencia para exportar.'); return }
    const name = (protein?.name || 'protein').replace(/[^a-z0-9_-]+/gi, '_').toLowerCase()
    const fasta = `>${protein.name || 'protein'}\n${seq.replace(/(.{60})/g, '$1\n')}\n`
    downloadBlob(fasta, `${name}.fasta`, 'text/plain')
  }, [selectedProteinIds, proteinsById])

  const handleExportImage = useCallback(async ({ format, scale, transparent }) => {
    const pluginRef = useMolstarStore.getState().pluginRef
    const plugin = pluginRef?.current
    if (!plugin) { alert('El visor 3D no está disponible.'); return }
    const id = selectedProteinIds[0]
    const protein = id ? proteinsById[id] : null
    const filename = protein?.name || null
    await exportViewerImage(plugin, { format, scale, transparent, filename })
  }, [selectedProteinIds, proteinsById])

  const handleExportPdf = useCallback(async () => {
    const id = selectedProteinIds[0]
    if (!id) { alert('Selecciona una proteína primero.'); return }
    const protein = proteinsById[id]
    if (!protein) return
    const pluginRef = useMolstarStore.getState().pluginRef
    const plugin = pluginRef?.current
    try {
      await exportProteinPdf(protein, plugin)
    } catch (err) {
      alert(`Error generando PDF: ${err.message}`)
    }
  }, [selectedProteinIds, proteinsById])

  const handleShareSession = useCallback(() => {
    const currentProteins = Object.values(proteinsById)
    if (currentProteins.length === 0) {
      toast.warning('No hay proteinas activas para compartir.')
      return
    }
    const pluginRef = useMolstarStore.getState().pluginRef
    const plugin = pluginRef?.current
    const { focusedResidue, viewerRepresentation, viewerLighting, viewerBackground } = useUIStore.getState()

    const encoded = serializeViewerState({
      proteinsById,
      selectedProteinIds,
      plugin,
      focusedResidue,
      viewerSettings: {
        representation: viewerRepresentation,
        lighting: viewerLighting,
        background: viewerBackground,
      },
    })

    const shareUrl = buildShareUrl(encoded)

    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Enlace copiado al portapapeles', {
        description: 'Cualquiera con este enlace vera la vista exacta que estas viendo.',
        duration: 4000,
      })
    }).catch(() => {
      navigator.clipboard.writeText(shareUrl)
      toast.info('Enlace generado', {
        description: 'No se pudo copiar automaticamente. El enlace esta en la consola.',
        duration: 5000,
      })
      console.log('[Share URL]', shareUrl)
    })
  }, [proteinsById, selectedProteinIds])

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdb,.cif,.mmcif,.fasta,.fas,.fa,.seq,.txt,.session"
        onChange={handleFileSelected}
      />

      <ExportImageDialog
        open={exportImageOpen}
        onOpenChange={setExportImageOpen}
        onExport={handleExportImage}
      />

      <ImportRcsbDialog
        open={rcsbOpen}
        onOpenChange={setRcsbOpen}
        onImport={handleRcsbImport}
      />

      <MenubarMenu>
        <MenubarTrigger>Archivo</MenubarTrigger>
        <MenubarContent className={contentClass}>

          <MenubarLabel className={labelClass}>Importar Estructura</MenubarLabel>
          <MenubarItem className={itemClass} onClick={handleImportLocal}>
            <span>Cargar Archivo Local (.pdb, .cif)</span>
          </MenubarItem>
          <MenubarItem className={itemClass} onClick={() => setRcsbOpen(true)}>
            <span>Obtener de RCSB PDB (por ID)</span>
          </MenubarItem>

          <MenubarSeparator className={separatorClass} />

          <MenubarLabel className={labelClass}>Exportar Datos</MenubarLabel>
          <MenubarItem className={itemClass} onClick={handleExportPdb}>
            <span>Exportar Coordenadas (.pdb)</span>
          </MenubarItem>
          <MenubarItem className={itemClass} onClick={handleExportFasta}>
            <span>Exportar Secuencia (FASTA)</span>
          </MenubarItem>
          <MenubarItem className={itemClass} onClick={() => setExportImageOpen(true)}>
            <span>Exportar Imagen (PNG / JPEG)</span>
          </MenubarItem>
          <MenubarItem className={itemClass} onClick={handleExportPdf}>
            <span>Exportar Reporte PDF</span>
          </MenubarItem>
          
          <MenubarSeparator className={separatorClass} />

          <MenubarLabel className={labelClass}>Compartir</MenubarLabel>
          <MenubarItem className={itemClass} onClick={handleShareSession}>
            <span>Generar Enlace de Compartición</span>
          </MenubarItem>

        </MenubarContent>
      </MenubarMenu>
    </>
  )
}
