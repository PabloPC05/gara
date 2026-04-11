// FROM /proteins/
export type JsonProteinsList = {
  protein_id: string,
  uniprot_id: string,
  pdb_id: string,
  protein_name: string,
  organism: string,
  length: number,
  molecular_weight: number,
  category: string,
  description: string,
  tags: string[]
}[];

// FROM /proteins/$ID // $ID based on JsonProteinsList.protein_id
export type JsonProteinData = {
  protein_id: string,
  uniprot_id: string,
  pdb_id: string,
  protein_name: string,
  organism: string,
  length: number,
  molecular_weight: number,
  isoelectric_point: number,
  category: number,
  description: string,
  function: string,
  cellular_location: string,
  activity: string,
  tags: string[],
  sequence: string,
  fasta_ready: string,
  known_structures: {
    pdb_id: string,
    method: string,
    resolution: number,
    publication: string,
  }[]
};
