import { Assets } from "pixi.js"

export async function loadAssets() {
	const manifest = {
		bundles: [
			{
				name: "game-screen",
				assets: [
					{
						alias: "background",
						src: "../assets/bg.png",
					},
				],
			},
		],
	}

	await Assets.init({ manifest })
	await Assets.backgroundLoadBundle(["game-screen"])

	const assets = [
		"../assets/door.png",
		"../assets/doorOpen.png",
		"../assets/doorOpenShadow.png",
		"../assets/handle.png",
		"../assets/handleShadow.png",
		"../assets/blink.png",
	]

	for (const asset of assets) {
		await Assets.load(asset)
	}
}
