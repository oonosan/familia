// Arma dist/ combinando la landing (public/) con el build de cada app hija.
// Para agregar una app nueva: metela en su propia carpeta con su propio
// build, y agregá una entrada al array APPS de abajo.
import { execSync } from "node:child_process";
import { cpSync, rmSync, mkdirSync } from "node:fs";

const APPS = [
  { dir: "cumple-gaia-react", buildDir: "dist", mountAt: "cumple-gaia" },
  {
    dir: "horas-react",
    buildDir: "dist",
    mountAt: "sil",
    env: { VITE_BASE: "/sil/", VITE_WORKER: "sil", VITE_WORKER_NAME: "Sil", VITE_WORKER_RATE: "5000" },
  },
  {
    dir: "horas-react",
    buildDir: "dist",
    mountAt: "adri",
    env: { VITE_BASE: "/adri/", VITE_WORKER: "adri", VITE_WORKER_NAME: "Adri", VITE_WORKER_RATE: "7000" },
  },
];

const root = new URL("..", import.meta.url).pathname.replace(/^\/([a-zA-Z]):/, "$1:");

rmSync(`${root}/dist`, { recursive: true, force: true });
mkdirSync(`${root}/dist`, { recursive: true });
cpSync(`${root}/public`, `${root}/dist`, { recursive: true });

for (const app of APPS) {
  const appPath = `${root}/${app.dir}`;
  console.log(`\n> building ${app.dir}`);
  const env = { ...process.env, ...(app.env || {}) };
  execSync("npm install", { cwd: appPath, stdio: "inherit", env });
  execSync("npm run build", { cwd: appPath, stdio: "inherit", env });
  cpSync(`${appPath}/${app.buildDir}`, `${root}/dist/${app.mountAt}`, { recursive: true });
}

console.log("\nBuild listo en dist/");
