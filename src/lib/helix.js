const RISE = 1.5;
const RADIUS = 2.3;
const TURN_DEG = 100;

const formatAtomLine = (serial, resSeq, x, y, z) => {
  const s = String(serial).padStart(5);
  const r = String(resSeq).padStart(4);
  const fx = x.toFixed(3).padStart(8);
  const fy = y.toFixed(3).padStart(8);
  const fz = z.toFixed(3).padStart(8);
  return `ATOM  ${s}  CA  ALA A${r}    ${fx}${fy}${fz}  1.00  0.00           C  `;
};

const formatConectLine = (a, b) =>
  `CONECT${String(a).padStart(5)}${String(b).padStart(5)}`;

/**
 * Genera un bloque PDB sintético con N átomos CA dispuestos como una hélice alfa
 * y los bonds entre residuos consecutivos. El offset se aplica directamente a las
 * coordenadas para evitar depender de `model.translate` en tiempo de render.
 */
export function buildHelixPdb(residues, offset = { x: 0, y: 0, z: 0 }) {
  const atoms = [];
  const bonds = [];
  const zStart = -(residues * RISE) / 2;

  for (let i = 0; i < residues; i++) {
    const angle = (i * TURN_DEG * Math.PI) / 180;
    const x = RADIUS * Math.cos(angle) + offset.x;
    const y = RADIUS * Math.sin(angle) + offset.y;
    const z = zStart + i * RISE + offset.z;
    atoms.push(formatAtomLine(i + 1, i + 1, x, y, z));
    if (i > 0) bonds.push(formatConectLine(i, i + 1));
  }

  return [...atoms, ...bonds, "END"].join("\n");
}
