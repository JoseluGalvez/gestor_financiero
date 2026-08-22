import { readFile, writeFile } from "node:fs/promises";

const source = await readFile("/home/ubuntu/gestor_financiero/supabase/functions/bootstrap-organization/index.ts", "utf8");
const payload = {
  project_id: "yuhmwljncejlqjrzkqpl",
  name: "bootstrap-organization",
  verify_jwt: true,
  entrypoint_path: "index.ts",
  files: [{ name: "index.ts", content: source }],
};

await writeFile("/home/ubuntu/gestor_financiero/supabase/functions/bootstrap-organization/deploy.json", JSON.stringify(payload));
