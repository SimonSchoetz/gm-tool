import { execSync } from "child_process";
import pkg from "../app/package.json" with { type: "json" };

const { version } = pkg;

execSync("git push origin main", { stdio: "inherit" });
execSync(`git tag v${version}`, { stdio: "inherit" });
execSync(`git push origin v${version}`, { stdio: "inherit" });
