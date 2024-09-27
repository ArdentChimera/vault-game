import { Application } from "pixi.js"
import { loadAssets } from "./assetLoader"
import { setupGame } from "./game"
import "./style.css"

const app = new Application()

async function init() {
	await app.init({ background: "#1099bb", resizeTo: window })
	document.body.appendChild(app.canvas)

	await loadAssets()
	await setupGame(app)
}

init()
