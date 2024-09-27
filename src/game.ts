import {
	Application,
	Sprite,
	Assets,
	FederatedPointerEvent,
	Text,
	Graphics,
	Container,
	TextStyle,
} from "pixi.js"
import { gsap } from "gsap"
import { PixiPlugin } from "gsap/PixiPlugin"
import { setPositions, resizeGame, createBlinks } from "./utils"

gsap.registerPlugin(PixiPlugin)

let currentAngle = 0
let isDoorOpen = false
let rotationCount = 0
let lastDirection = 0

let door: Sprite | null = null
let handle: Sprite
let handleShadow: Sprite
let doorOpen: Sprite | null = null
let doorOpenShadow: Sprite | null = null
let app: Application
let blinkContainer: Container

let combination: [number, string][] = []
let userInput: [number, string][] = []
let currentRotations = 0

let timerContainer: Container
let timerText: Text
let countdown: number = 30
let doorOpenTime: number = 0
let isCountingDown: boolean = false
let timerInterval: number | null = null

export const BASE_WIDTH = 1920
export const BASE_HEIGHT = 1080

export async function setupGame(application: Application) {
	app = application
	const backgroundTexture = await Assets.loadBundle("game-screen")
	const background = Sprite.from(backgroundTexture.background)
	app.stage.addChild(background)

	door = Sprite.from(await Assets.load("../assets/door.png"))
	doorOpen = Sprite.from(await Assets.load("../assets/doorOpen.png"))
	doorOpenShadow = Sprite.from(
		await Assets.load("../assets/doorOpenShadow.png")
	)
	handle = Sprite.from(await Assets.load("../assets/handle.png"))
	handleShadow = Sprite.from(await Assets.load("../assets/handleShadow.png"))
	;[door, doorOpen, doorOpenShadow, handle, handleShadow].forEach(sprite => {
		if (sprite) {
			sprite.anchor.set(0.5)
		}
	})

	app.stage.addChild(door!, handleShadow!, handle!)

	blinkContainer = new Container()
	app.stage.addChild(blinkContainer)

	createTimerDisplay()

	handleResize()
	window.addEventListener("resize", handleResize)

	if (handle) {
		handle.eventMode = "static"
		handle.cursor = "pointer"
		handle.on("pointerdown", (event: FederatedPointerEvent) =>
			onHandleClick(event, handle!, handleShadow!)
		)
	}

	generateCombination()
	console.log(`Your secret combination is: ${combinationToString(combination)}`)

	setTimeout(() => {
		console.log("Timer has started! You have 30 sec...")
		startCountdown()
	}, 8000)
}

function createTimerDisplay() {
	const timerWidth = 200
	const timerHeight = 80

	timerContainer = new Container()

	const background = new Graphics()
	background.fill({ color: "0x000000", alpha: 0.5 })
	background.roundRect(0, 0, 100, 50, 10)
	timerContainer.addChild(background)

	const style = new TextStyle({
		fontFamily: "Arial",
		fontSize: 32,
		fill: "white",
		align: "center",
	})

	timerText = new Text({ text: countdown.toString(), style: style })
	timerText.anchor.set(0.5)
	timerText.scale.set(0.8)
	timerText.position.set(timerWidth / 2, timerHeight / 2)
	timerContainer.addChild(timerText)

	app.stage.addChild(timerContainer)
}

function handleResize() {
	const scaleFactor = Math.min(
		app.screen.width / BASE_WIDTH,
		app.screen.height / BASE_HEIGHT
	)

	scaleGameElements(scaleFactor)

	// Call the resizeGame function from utils.ts
	resizeGame(
		app,
		app.stage.getChildAt(0) as Sprite, // background
		door!,
		doorOpen!,
		doorOpenShadow!,
		handle!,
		handleShadow!
	)

	// Reposition timer
	if (timerContainer) {
		const timerScale = 0.6 // Adjust this factor to change the timer size relative to the background
		timerContainer.scale.set(timerScale)

		// Position timer in the center of the background
		timerContainer.position.set(
			app.screen.width / 3.9 - timerContainer.width / 2,
			app.screen.height / 2.3 - timerContainer.height / 2
		)
	}

	repositionBlinks(scaleFactor)
}

function scaleGameElements(scaleFactor: number) {
	const scales = {
		door: 0.32,
		doorOpen: 0.32,
		doorOpenShadow: 0.33,
		handle: 0.3,
		handleShadow: 0.3,
	}

	if (door) door.scale.set(scales.door * scaleFactor)
	if (doorOpen) doorOpen.scale.set(scales.doorOpen * scaleFactor)
	if (doorOpenShadow)
		doorOpenShadow.scale.set(scales.doorOpenShadow * scaleFactor)
	if (handle) handle.scale.set(scales.handle * scaleFactor)
	if (handleShadow) handleShadow.scale.set(scales.handleShadow * scaleFactor)

	if (timerContainer) {
		timerContainer.scale.set(1.5 * scaleFactor)
	}

	if (blinkContainer) {
		blinkContainer.children.forEach(blink => {
			blink.scale.set(1 * scaleFactor)
		})
	}
}

function repositionBlinks(scaleFactor: number) {
	const blinkPositions = [
		{ x: BASE_WIDTH / 2.6, y: BASE_HEIGHT / 1.98 },
		{ x: BASE_WIDTH / 1.87, y: BASE_HEIGHT / 1.61 },
		{ x: BASE_WIDTH / 2.1, y: BASE_HEIGHT / 2.02 },
	]

	blinkContainer.children.forEach((blink, index) => {
		const position = blinkPositions[Math.floor(index / 3)]
		blink.position.set(position.x * scaleFactor, position.y * scaleFactor)
	})
}

function onHandleClick(
	event: FederatedPointerEvent,
	handle: Sprite,
	handleShadow: Sprite
) {
	if (!isCountingDown) return

	const localPosition = event.getLocalPosition(handle)
	const clickedOnRightSide = localPosition.x > 0

	let rotationDirection = clickedOnRightSide ? 1 : -1

	currentRotations++
	animateHandle(rotationDirection, handle, handleShadow)

	if (currentRotations === combination[userInput.length][0]) {
		userInput.push([
			currentRotations,
			rotationDirection === 1 ? "clockwise" : "counterclockwise",
		])

		currentRotations = 0

		if (userInput.length === 3) {
			handleDoorMovement()
		}
	}

	lastDirection = rotationDirection
}

function animateHandle(
	rotationDirection: number,
	handle: Sprite,
	handleShadow: Sprite
) {
	const rotationAmount = (Math.PI / 3) * rotationDirection
	const newAngle = currentAngle + rotationAmount

	gsap.to(handle, {
		rotation: newAngle,
		duration: 0.5,
		ease: "power2.inOut",
		onComplete: () => {
			currentAngle = newAngle
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

	gsap.to(handle, {
		x: handle.x + 2 * rotationDirection,
		y: handle.y + 1,
		duration: 0.25,
		yoyo: true,
		repeat: 1,
		ease: "power1.inOut",
	})
}

function openDoor() {
	if (!door || !handle || !handleShadow || !doorOpen || !doorOpenShadow) return

	isDoorOpen = true
	doorOpenTime = Date.now()
	if (timerText) {
		timerText.text = "Door Open"
	}

	disableHandleInteraction()
	stopCountdown()

	gsap.to([door, handle, handleShadow], {
		duration: 1,
		scale: 0.1,
		y: 60,
		yoyo: true,
		repeat: 1,
		ease: "power1.inOut",
	})

	app.stage.addChild(doorOpenShadow, doorOpen)
	door.visible = false

	gsap.to(handle, {
		rotation: 360 * 4,
		duration: 5,
		ease: "none",
	})

	createBlinks(app, blinkContainer)

	// Set a timeout to close the door after 8 seconds
	setTimeout(() => {
		if (isDoorOpen) {
			closeDoor()
		}
	}, 8000)
}

function closeDoor() {
	if (!door || !handle || !handleShadow || !doorOpen || !doorOpenShadow) return

	isDoorOpen = false
	app.stage.removeChild(doorOpenShadow, doorOpen)
	door.visible = true
	handle.visible = false
	handleShadow.visible = false

	handle.scale.set(0.17)
	handle.x = app.screen.width / 2.04

	handleShadow.scale.set(0.17)
	app.stage.addChild(door, handleShadow, handle)

	gsap.to(door, {
		duration: 0.2,
		scale: 0.17,
		ease: "power1.inOut",
		onComplete: () => {
			handle.visible = true
			handleShadow.visible = true

			gsap.to([handle, handleShadow], {
				rotation: 0,
				duration: 0.5,
				onComplete: () => {
					resetGameState()
					generateCombination()
					console.log(
						"New combination generated:",
						combinationToString(combination)
					)
					startCountdown()
					enableHandleInteraction()
				},
			})
		},
	})
}

function startCountdown() {
	isCountingDown = true
	countdown = 30
	updateTimerDisplay()

	if (timerInterval) {
		clearInterval(timerInterval)
	}

	timerInterval = setInterval(() => {
		if (isCountingDown && countdown > 0) {
			countdown--
			updateTimerDisplay()

			if (countdown <= 0) {
				handleTimeUp()
			}
		}
	}, 1000) as unknown as number
}

function handleTimeUp() {
	stopCountdown()
	if (timerText) {
		timerText.text = "Time's Up!"
		timerText.scale.set(0.3)
	}
	console.log("Time's up!")
	disableHandleInteraction()

	if (handle && handleShadow) {
		gsap.to([handle, handleShadow], {
			rotation: 360 * 2,
			duration: 1,
			ease: "power2.inOut",
			onComplete: () => {
				gsap.to([handle, handleShadow], {
					rotation: 0,
					duration: 0.5,
					ease: "power2.inOut",
					onComplete: () => {
						setTimeout(() => {
							timerText.scale.set(0.8)
							resetGameState()
							generateCombination()
							console.log(
								"New combination generated:",
								combinationToString(combination)
							)
							startCountdown()
							enableHandleInteraction()
						}, 1000)
					},
				})
			},
		})
	}
}

function disableHandleInteraction() {
	if (handle) {
		handle.eventMode = "none"
	}
}

function enableHandleInteraction() {
	if (handle) {
		handle.eventMode = "static"
	}
}

function stopCountdown() {
	isCountingDown = false
	if (timerInterval) {
		clearInterval(timerInterval)
		timerInterval = null
	}
}

function updateTimerDisplay() {
	if (timerText) {
		timerText.text = countdown.toString()
	}
}

function handleDoorMovement() {
	if (checkCombination()) {
		console.log("Correct combination entered!")
		openDoor()
	} else {
		console.log("Incorrect combination. Try again!")
		handleIncorrectCombination()
	}
}

function handleIncorrectCombination() {
	if (!handle || !handleShadow) return

	disableHandleInteraction()

	gsap.to([handle, handleShadow], {
		rotation: 360 * 2,
		duration: 1,
		ease: "power1.inOut",
		onComplete: () => {
			gsap.to([handle, handleShadow], {
				rotation: 0,
				duration: 0.5,
				ease: "power1.inOut",
				onComplete: () => {
					resetGameState()
					generateCombination()
					console.log(
						"New combination generated:",
						combinationToString(combination)
					)
					startCountdown()
					enableHandleInteraction()
				},
			})
		},
	})
}

function generateCombination() {
	const directions = ["clockwise", "counterclockwise"]
	combination = Array(3)
		.fill(null)
		.map(() => [
			Math.floor(Math.random() * 9) + 1,
			directions[Math.floor(Math.random() * 2)],
		]) as [number, string][]
}

function checkCombination(): boolean {
	if (userInput.length !== combination.length) {
		return false
	}
	return combination.every((step, index) => {
		const result =
			step[0] === userInput[index][0] && step[1] === userInput[index][1]
		return result
	})
}

function combinationToString(comb: [number, string][]): string {
	return comb.map(([count, direction]) => `${count} ${direction}`).join(", ")
}

function resetGameState() {
	userInput = []
	currentRotations = 0
	lastDirection = 0
	currentAngle = 0
	rotationCount = 0
	isDoorOpen = false
	stopCountdown()
	countdown = 30
	updateTimerDisplay()
	disableHandleInteraction()
}
