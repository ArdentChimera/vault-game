import { Application, Sprite, Assets, Container } from "pixi.js"
import { gsap } from "gsap"
import { BASE_WIDTH, BASE_HEIGHT } from "./game"

export function setPositions(
	app: Application,
	door: Sprite,
	doorOpen: Sprite,
	doorOpenShadow: Sprite,
	handle: Sprite,
	handleShadow: Sprite
) {
	const scaleFactor = Math.min(
		app.screen.width / BASE_WIDTH,
		app.screen.height / BASE_HEIGHT
	)

	door.position.set(
		(BASE_WIDTH / 1.97) * scaleFactor,
		(BASE_HEIGHT / 1.8) * scaleFactor
	)
	doorOpen.position.set(
		(BASE_WIDTH / 1.3) * scaleFactor,
		(BASE_HEIGHT / 1.8) * scaleFactor
	)
	doorOpenShadow.position.set(
		(BASE_WIDTH / 1.28) * scaleFactor,
		(BASE_HEIGHT / 1.73) * scaleFactor
	)

	const handleOffsetX = door.width * -0.04
	const handleOffsetY = 0

	handle.position.set(door.x + handleOffsetX, door.y + handleOffsetY)
	handleShadow.position.set(door.x, door.y)
}

export function resizeGame(
	app: Application,
	background: Sprite,
	door: Sprite,
	doorOpen: Sprite,
	doorOpenShadow: Sprite,
	handle: Sprite,
	handleShadow: Sprite
) {
	const scaleFactor = Math.min(
		app.screen.width / BASE_WIDTH,
		app.screen.height / BASE_HEIGHT
	)

	// Resize background
	const bgScaleX = app.screen.width / background.texture.width
	const bgScaleY = app.screen.height / background.texture.height
	const bgScale = Math.min(bgScaleX, bgScaleY)
	background.scale.set(bgScale)
	background.position.set(
		(app.screen.width - background.width) / 2,
		(app.screen.height - background.height) / 2
	)

	// Reposition game elements
	setPositions(app, door, doorOpen, doorOpenShadow, handle, handleShadow)
}

export async function createBlinks(app: Application, container: Container) {
	const blinkTexture = await Assets.load("../assets/blink.png")

	const blinkPositions = [
		{ x: BASE_WIDTH / 2.4, y: BASE_HEIGHT / 1.8 },
		{ x: BASE_WIDTH / 1.87, y: BASE_HEIGHT / 1.4 },
		{ x: BASE_WIDTH / 2.1, y: BASE_HEIGHT / 1.8 },
	]

	const scaleFactor = Math.min(
		app.screen.width / BASE_WIDTH,
		app.screen.height / BASE_HEIGHT
	)

	blinkPositions.forEach(position => {
		for (let i = 0; i < 3; i++) {
			const blink = Sprite.from(blinkTexture)
			blink.scale.set(0.15 * scaleFactor)
			blink.anchor.set(0.5)
			blink.position.set(position.x * scaleFactor, position.y * scaleFactor)
			container.addChild(blink)
		}
	})

	container.children.forEach(blink => {
		gsap.to(blink, {
			rotation: 360,
			duration: 500,
			repeat: -1,
			ease: "none",
		})
	})
}
