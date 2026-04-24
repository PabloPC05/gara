import { StructureProperties } from "molstar/lib/mol-model/structure.js";
import type { StructureElement } from "molstar/lib/mol-model/structure.js";

export function getPreferredSeqId(
	loc: StructureElement.Location,
): number | null {
	const labelSeqId = StructureProperties.residue.label_seq_id(loc);
	if (Number.isFinite(labelSeqId) && labelSeqId > 0) return labelSeqId;
	const authSeqId = StructureProperties.residue.auth_seq_id(loc);
	return Number.isFinite(authSeqId) && authSeqId > 0 ? authSeqId : null;
}

export function getRefKey(ref: unknown): string {
	if (typeof ref === "string") return ref;
	if (ref && typeof ref === "object" && "ref" in ref)
		return (ref as { ref: string }).ref;
	return "";
}
