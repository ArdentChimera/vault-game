import { Application, Sprite, Assets, FederatedPointerEvent } from "pixi.js"
import { gsap } from "gsap"
import { PixiPlugin } from "gsap/PixiPlugin"
import "./style.css"

gsap.registerPlugin(PixiPlugin)

const app = new Application()

async function init() {
	await app.init({ background: "#1099bb", resizeTo: window })

	document.body.appendChild(app.canvas)

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

	door.scale.set(1.1)
	door.anchor.set(0.5)

	app.stage.addChild(door)

	const doorOpenTexture = await Assets.load("../assets/doorOpen.png")
	const doorOpen = Sprite.from(doorOpenTexture)

	doorOpen.scale.set(1.1)
	doorOpen.anchor.set(0.5)

	const doorOpenShadowTexture = await Assets.load(
		"../assets/doorOpenShadow.png"
	)
	const doorOpenShadow = Sprite.from(doorOpenShadowTexture)

	doorOpenShadow.scale.set(1.15)
	doorOpenShadow.anchor.set(0.5)

	const handleTexture = await Assets.load("../assets/handle.png")
	const handle = Sprite.from(handleTexture)

	handle.scale.set(1)
	handle.anchor.set(0.5)

	const handleShadowTexture = await Assets.load("../assets/handleShadow.png")
	const handleShadow = Sprite.from(handleShadowTexture)

	handleShadow.scale.set(1)
	handleShadow.anchor.set(0.5)

	app.stage.addChild(handleShadow)
	app.stage.addChild(handle)

	function setPositions() {
		door.x = app.screen.width / 1.97
		door.y = app.screen.height / 2.06

		doorOpen.x = app.screen.width / 1.2
		doorOpen.y = app.screen.height / 2.06

		doorOpenShadow.x = app.screen.width / 1.17
		doorOpenShadow.y = app.screen.height / 1.96

		// Calculate the handle position relative to the door
		const handleOffsetX = door.width * -0.04 // Adjust this value as needed
		const handleOffsetY = 0 // Adjust if you need vertical offset

		// Position the handle relative to the door
		handle.x = door.x + handleOffsetX
		handle.y = door.y + handleOffsetY

		handleShadow.x = door.x
		handleShadow.y = door.y
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
				handleDoorMovement(currentAngle, rotationDirection, rotationCount)
			},
		})

		gsap.to(handleShadow, {
			rotation: newAngle,
			duration: 0.5,
			ease: "power2.inOut",
			onComplete: () => {
				currentAngle = newAngle
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

	let isDoorOpen: boolean = false
	let doorOpenTime: number = 0

	const openDoor = () => {
		isDoorOpen = true
		doorOpenTime = Date.now()
		console.log(doorOpenTime)

		// Door opening animation
		gsap.to(door, {
			duration: 1,
			scale: 0.1,
			y: 60,
			yoyo: true,
			repeat: 1,
			ease: "power1.inOut",
		})

		gsap.to(handle, {
			duration: 1,
			scale: 0.1,
			y: 60,
			yoyo: true,
			repeat: 1,
			ease: "power1.inOut",
		})

		gsap.to(handleShadow, {
			duration: 1,
			scale: 0.1,
			y: 60,
			yoyo: true,
			repeat: 1,
			ease: "power1.inOut",
		})

		app.stage.addChild(doorOpenShadow)
		app.stage.addChild(doorOpen)

		door.visible = false

		// Start handle spinning (4 times in 5 seconds)
		gsap.to(handle, {
			rotation: 360 * 4, // Spin 4 times (360 degrees * 4)
			duration: 5, // Over 5 seconds
			ease: "none",
		})

		createBlinks()
	}

	const closeDoor = () => {
		isDoorOpen = false
		app.stage.removeChild(doorOpenShadow)
		app.stage.removeChild(doorOpen)
		// Ensure the closed door and handle are added to the stage at the same time
		door.visible = true
		handle.visible = false
		handleShadow.visible = false

		handle.scale.set(1)
		handle.x = app.screen.width / 2.04

		handleShadow.scale.set(1)
		// Ensure both door and handle are added at the same time to the stage
		app.stage.addChild(door)
		app.stage.addChild(handleShadow)
		app.stage.addChild(handle)

		// Simultaneous animation for the door
		gsap.to(door, {
			duration: 0.2, // Set duration to match the handle's rotation
			scale: 1.1,
			ease: "power1.inOut",
			onComplete: () => {
				// Make the handle visible after the door animation is complete
				handle.visible = true
				handleShadow.visible = true

				// Spin the handle 4 times after the door closes
				gsap.to([handle, handleShadow], {
					rotation: 360 * 2,
					duration: 2,
					repeat: 0,
					repeatDelay: 0,
					ease: "none",
					onComplete: () => {
						// Reset the handle's rotation after spinning
						gsap.to([handle, handleShadow], {
							rotation: 0,
							duration: 0.5,
							onComplete: () => {
								currentAngle = 0
								rotationCount = 0
								lastDirection = 0
							},
						})
					},
				})
			},
		})
	}

	const createBlinks = async () => {
		const blinkTexture = await Assets.load("../assets/blink.png")

		const blinkPositions = [
			{ x: app.screen.width / 2.6, y: app.screen.height / 1.98 },
			{ x: app.screen.width / 1.87, y: app.screen.height / 1.61 },
			{ x: app.screen.width / 2.1, y: app.screen.height / 2.02 },
		]

		const blinks: any = []

		blinkPositions.forEach((position, index) => {
			const blink = Sprite.from(blinkTexture)
			blink.scale.set(0.9)
			blink.anchor.set(0.5)
			blink.x = position.x
			blink.y = position.y
			app.stage.addChild(blink)

			const blink2 = Sprite.from(blinkTexture)
			blink2.scale.set(0.9)
			blink2.anchor.set(0.5)
			blink2.x = position.x
			blink2.y = position.y
			app.stage.addChild(blink2)

			const blink3 = Sprite.from(blinkTexture)
			blink3.scale.set(0.9)
			blink3.anchor.set(0.5)
			blink3.x = position.x
			blink3.y = position.y
			app.stage.addChild(blink3)

			blinks[index] = blink
		})

		blinks.forEach((blink: object) => {
			gsap.to(blink, {
				rotation: 360,
				duration: 500,
				repeat: 0,
				repeatDelay: 0,
				ease: "none",
			})
		})
	}

	// Optional: Function to handle game logic based on rotation state
	async function handleDoorMovement(
		angle: number,
		direction: number,
		count: number
	) {
		console.log(
			`Rotation: ${angle}, Direction: ${
				direction === 1 ? "Clockwise" : "Counterclockwise"
			}, Count: ${count}`
		)
		// Implement your game logic here

		if (count === 2) {
			openDoor()

			setTimeout(() => {
				if (isDoorOpen) {
					closeDoor()
				}
			}, 8000)
		}
	}
}

init()
