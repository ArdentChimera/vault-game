import { Application, Sprite, Assets, FederatedPointerEvent } from "pixi.js"
import { gsap } from "gsap"
import { PixiPlugin } from "gsap/PixiPlugin"
import "./style.css"

gsap.registerPlugin(PixiPlugin)

const app = new Application()

async function init() {
	// Initialize the application
	await app.init({ background: "#1099bb", resizeTo: window })

	document.body.appendChild(app.canvas)

	// Define the manifest
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
	const backgroundTexture = await Assets.loadBundle("game-screen")
	const background = Sprite.from(backgroundTexture.background)

	app.stage.addChild(background)

	const doorTexture = await Assets.load("../assets/door.png")
	const door = Sprite.from(doorTexture)

	door.scale.set(0.28)
	door.anchor.set(0.5)

	app.stage.addChild(door)

	const handleTexture = await Assets.load("../assets/handle.png")
	const handle = Sprite.from(handleTexture)

	handle.scale.set(0.27)
	handle.anchor.set(0.5)

	app.stage.addChild(handle)

	function setPositions() {
		// Position the door (keep your original positioning)
		door.x = app.screen.width / 1.97
		door.y = app.screen.height / 2.06

		// Calculate the handle position relative to the door
		const handleOffsetX = door.width * -0.04 // Adjust this value as needed
		const handleOffsetY = 0 // Adjust if you need vertical offset

		// Position the handle relative to the door
		handle.x = door.x + handleOffsetX
		handle.y = door.y + handleOffsetY
	}

	// Responsive resize function for background
	function resizeGame() {
		const scaleX = app.screen.width / background.texture.width
		const scaleY = app.screen.height / background.texture.height
		const scale = Math.max(scaleX, scaleY)

		background.width = background.texture.width * scale
		background.height = background.texture.height * scale

		background.x = (app.screen.width - background.width) / 2
		background.y = (app.screen.height - background.height) / 2

		setPositions()
	}

	// Initial resize
	resizeGame()

	// Listen to window resize and adjust
	window.addEventListener("resize", resizeGame)

	// Make the handle interactive
	handle.eventMode = "static"
	handle.cursor = "pointer"

	// Track rotation state
	let currentAngle = 0
	let rotationCount = 0
	let lastDirection = 0 // 0 for initial state, 1 for clockwise, -1 for counterclockwise

	// Add click event listener to the handle
	handle.on("pointerdown", onHandleClick)

	function onHandleClick(event: FederatedPointerEvent) {
		const localPosition = event.getLocalPosition(handle)
		const clickedOnRightSide = localPosition.x > 0

		let rotationDirection = clickedOnRightSide ? 1 : -1

		// Check if we need to reset the count when changing direction
		if (lastDirection !== 0 && rotationDirection !== lastDirection) {
			rotationCount = 0
		}

		if (rotationCount < 6) {
			animateHandle(rotationDirection)
			rotationCount++
			lastDirection = rotationDirection
		} else {
			// If 6 rotations are complete, force the opposite direction
			rotationDirection = -lastDirection
			animateHandle(rotationDirection)
			rotationCount = 1
			lastDirection = rotationDirection
		}
	}

	function animateHandle(rotationDirection: number) {
		const rotationAmount = (Math.PI / 3) * rotationDirection // 60 degrees
		const newAngle = currentAngle + rotationAmount

		// Animate handle rotation
		gsap.to(handle, {
			rotation: newAngle,
			duration: 0.5,
			ease: "power2.inOut",
			onComplete: () => {
				currentAngle = newAngle
				// Optional: Trigger game logic here
				handleGameLogic(currentAngle, rotationDirection, rotationCount)
			},
		})

		// Optional: Add a slight movement to simulate turning
		gsap.to(handle, {
			x: handle.x + 2 * rotationDirection,
			y: handle.y + 1,
			duration: 0.25,
			yoyo: true,
			repeat: 1,
			ease: "power1.inOut",
		})
	}

	// Optional: Function to handle game logic based on rotation state
	function handleGameLogic(angle: number, direction: number, count: number) {
		console.log(
			`Rotation: ${angle}, Direction: ${
				direction === 1 ? "Clockwise" : "Counterclockwise"
			}, Count: ${count}`
		)
		// Implement your game logic here
	}
}

init()
