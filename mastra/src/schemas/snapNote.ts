export type SnapNoteAnalysisInput = {
  image_path: string;
};

export type SnapNoteAnalysisOutput = {
  title: string | null;
  summary: string | null;
  tags: string[];
  next_actions: string[];
  raw_text: string | null;
};

export const snapNoteOutputExample: SnapNoteAnalysisOutput = {
  title: "Coffee brewing notes",
  summary:
    "A photo of a coffee package with useful record information extracted into a readable draft.",
  tags: ["coffee", "note", "draft"],
  next_actions: ["Review extracted fields", "Save the final note"],
  raw_text: null,
};

