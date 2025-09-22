import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export function loadRubric(id: string) {
  const p = path.join(process.cwd(), "rubrics", `${id}.yaml`);
  const raw = fs.readFileSync(p, "utf8");
  return yaml.load(raw) as any;
}
