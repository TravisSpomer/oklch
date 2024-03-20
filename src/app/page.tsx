"use client"
import { useComputed, useSignal, useSignalEffect, useSignals } from "@preact/signals-react/runtime"
import { clampChroma } from "culori"
import chroma, { Color } from "chroma-js"

import { oklchColorToCss, type OklchColor } from "./OklchColor"

import styles from "./page.module.css"
import Swatch from "./Swatch"

interface Ramp {
	name: string
	baseColors: OklchColor[]
}

export default function Home() {
	useSignals()

	const ramps = useSignal<Ramp[]>([
		{ name: "Blue", baseColors: [
			{ lightness: .975, chroma: 0.006, hue: 240 },
			{ lightness: .570, chroma: 0.124, hue: 248 },
			{ lightness: .345, chroma: 0.140, hue: 278 },
		] },
		{ name: "Red", baseColors: [
			{ lightness: .344, chroma: 0.091, hue: 13.5},
			{ lightness: .570, chroma: 0.200, hue: 21 },
			{ lightness: .952, chroma: 0.018, hue: 30 },
		] },
		{ name: "Ocean", baseColors: [
			{ lightness: 0.20, chroma: 0.124, hue: 250 },
			{ lightness: 1.00, chroma: 0.050, hue: 160 },
		] },
		{ name: "Bloom", baseColors: [
			{ lightness: .344, chroma: 0.091, hue: 13.5},
			{ lightness: .737, chroma: 0.188, hue: 337},
			{ lightness: .980, chroma: 0.014, hue: 337 },
		] },
		{ name: "Gold", baseColors: [
			{ lightness: 0.350, chroma: 0.090, hue: 30 },
			{ lightness: 0.662, chroma: 0.205, hue: 70 },
			{ lightness: 0.950, chroma: 0.200, hue: 102 },
		] },
		{ name: "Grey", baseColors: [
			{ lightness: 0.50, chroma: 0.001, hue: 180 },
		] },
	])

	// The defaults should probably instead be calculated using gamma or something else more clever than picking arbitrarily.
	const lightnessesString = useSignal("")
	const lightnesses = useSignal([ .10, .25, .35, .40, .45, .50, .55, .60, .65, .70, .75, .80, .85, .90, .95, .98 ])
	useSignalEffect((): void => {

	})

	const colorsString = useSignal("")

	const colorsManualMethod = useComputed<OklchColor[][]>(() => {
		return ramps.value.map(ramp => createColorRampManually(ramp.baseColors, lightnesses.value))
	})

	const colorsUsingChromaJs = useComputed<OklchColor[][]>(() => {
		return ramps.value.map(ramp => createColorRampUsingChromaJs(ramp.baseColors, lightnesses.value))
	})

	const colorsUsingCss = useComputed<string[][]>(() => {
		return ramps.value.map(ramp => createColorRampUsingCss(ramp.baseColors, lightnesses.value))
	})

	return (
		<main className={styles.main}>
			<h1>OKLCH color ramps</h1>
			<p>This is an experiment showing how one could create perceptually uniform color ramps based on <em>multiple</em> source colors. Notice how in each color ramp, 30% appears identically bright, and so does 65%, 90%, and so on—that's definitely not the case with sRGB. This ensures that white text is always accessible on the 30% slot for a set of source colors, and black text is always accessible on the 90% slot. All this remains true with all colors and lightness values.</p>
			<p>This technique also allows for color ramps in which the hue is not the same across the spectrum. Notice that the "Ocean" ramp starts with a royal blue and ends with a seafoam green.</p>
			<h3>Custom colors</h3>
			<label>
				Enter one or more CSS colors separated by commas:
				<br />
				<input type="text" value={colorsString.value} onChange={ev => colorsString.value = ev.target.value} onKeyDown={onNewColorsKeyDown} size={80} />
			</label>
			<button type="button" onClick={addColorPalette}>Add</button>
			<br />
			<small><em>Example: c43e1c, goldenrod, lime</em></small>
			<h3>Lightness ramp</h3>
			<label>
				Enter one or more lightness percentages, separated by commas:
				<br />
				<input type="text" value={lightnessesString.value} onChange={onLightnessesChange} size={80} />
			</label>
			<br />
			<small><em>Example: 10, 25, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98</em></small>
			<h2>My version</h2>
			<p>My version is mostly simple math, with a dash of <code>culori.js</code> to handle the very complex logic of gamut-mapping very light colors to sRGB. (Note, for example, that in the other versions but not this one, the brightest two colors of Gold are too saturated and not the same perceived lightness as the ones above and below.)</p>
			<table>
				<thead>
					<tr>
						<th></th>
						{lightnesses.value.map((lightness, index) => <th key={index}>{Math.round(lightness * 1000) / 10}</th>)}
					</tr>
				</thead>
				<tbody>
					{colorsManualMethod.value.map((row, rowIndex) => <tr key={rowIndex}>
						<th>{ramps.value[rowIndex].name}</th>
						{row.map((color, colorIndex) => <td key={colorIndex}><Swatch color={color} /></td>)}
					</tr>)}
				</tbody>
			</table>
			<h2>A version using chroma.js</h2>
			<p>The chroma.js library has <a href="https://gka.github.io/chroma.js/#color-scales" target="_blank">built-in support for color scales</a> but I like my version better.</p>
			<table>
				<thead>
					<tr>
						<th></th>
						{lightnesses.value.map((lightness, index) => <th key={index}>{Math.round(lightness * 1000) / 10}</th>)}
					</tr>
				</thead>
				<tbody>
					{colorsUsingChromaJs.value.map((row, rowIndex) => <tr key={rowIndex}>
						<th>{ramps.value[rowIndex].name}</th>
						{row.map((color, colorIndex) => <td key={colorIndex}><Swatch color={color} /></td>)}
					</tr>)}
				</tbody>
			</table>
			<h2>A version using pure CSS</h2>
			<p>CSS Color Module Level 4 has <code>color-mix()</code> which will do the work for us! But it appears that no browser is currently gamut-mapping colors properly.</p>
			<table>
				<thead>
					<tr>
						<th></th>
						{lightnesses.value.map((lightness, index) => <th key={index}>{Math.round(lightness * 1000) / 10}</th>)}
					</tr>
				</thead>
				<tbody>
					{colorsUsingCss.value.map((row, rowIndex) => <tr key={rowIndex}>
						<th>{ramps.value[rowIndex].name}</th>
						{row.map((color, colorIndex) => <td key={colorIndex}><Swatch color={color} /></td>)}
					</tr>)}
				</tbody>
			</table>
		</main>
	)

	function onNewColorsKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
		if (ev.key === "Enter") addColorPalette()
	}
	
	function addColorPalette() {
		try {
			const colorStrings = colorsString.value.split(",").map(string => string.trim()).filter(string => !!string)
			const colors = colorStrings.filter(string => chroma.valid(string)).map(string => chroma(string)).map(chromaColorToOurs)
			if (colors.length < 1) return

			ramps.value = [...ramps.value, { name: colors.length === 1 ? colorStrings[0] : `[${colors.length}…]`, baseColors: colors }]
			colorsString.value = ""
		}
		catch (ex) {
			console.error(ex)
			return
		}
	}

	function onLightnessesChange(ev: React.ChangeEvent<HTMLInputElement>) {
		lightnessesString.value = ev.target.value
		const value = parseLightnesses(ev.target.value)
		if (value) lightnesses.value = value
	}
}

function chromaColorToOurs(color: Color): OklchColor {
	const oklch = color.oklch()
	return { lightness: oklch[0], chroma: oklch[1], hue: isNaN(oklch[2]) ? 345 : oklch[2] }
}

function parseLightnesses(input: string): number[] | null {
	try {
		const percentStrings = input.split(",").map(string => string.trim()).filter(string => !!string)
		const numbers = percentStrings.map(string => parseInt(string, 10)).filter(number => !isNaN(number)).map(number => number < 0 ? 0 : number > 100 ? 1 : number / 100)
		numbers.sort()
		return numbers.length ? numbers : null
	}
	catch (ex) {
		console.error(ex)
		return null
	}
}

function createColorRampManually(baseColors: OklchColor[], lightnesses: number[]): OklchColor[] {
	// Sort the base colors for each ramp by lightness if they aren't already.
	baseColors.sort((a, b) => a.lightness - b.lightness)

	// Then, generate a new set of colors from the base colors.
	return lightnesses.map(lightness => createColorWithLightness(baseColors, lightness))
}

function createColorWithLightness(sortedBaseColors: readonly OklchColor[], lightness: number): OklchColor {
	const stopsCount = sortedBaseColors.length
	if (stopsCount === 0) throw new Error("At least one base color is required.")
	if (stopsCount > 1 && sortedBaseColors[0].lightness > sortedBaseColors[stopsCount - 1].lightness) throw new Error("Base colors must be sorted from lightness, from 0 to 1.")

	let color: OklchColor

	// Otherwise, figure out where this new color lies in the spectrum.
	if (stopsCount === 1 || lightness <= sortedBaseColors[0].lightness)
	{
		// Darker than all base colors, or there's only one base color anyway
		color = { ...sortedBaseColors[0], lightness: lightness }
	}
	else if (lightness >= sortedBaseColors[stopsCount - 1].lightness)
	{
		// Lighter than all base colors
		color = { ...sortedBaseColors[stopsCount - 1], lightness: lightness }
	}
	else
	{
		// Somewhere in the middle

		// Find the darkest base color that is lighter than this one.
		const nextIndex = sortedBaseColors.findIndex(other => other.lightness > lightness)
		const prev = sortedBaseColors[nextIndex - 1]
		const next = sortedBaseColors[nextIndex]
		const proportionOfNext = (lightness - prev.lightness) / (next.lightness - prev.lightness)
		const prevAlpha = (prev.alpha === undefined || prev.alpha === null) ? 1 : prev.alpha
		const nextAlpha = (next.alpha === undefined || next.alpha === null) ? 1 : next.alpha

		// Linearly interpolate between the nearest two base colors.
		// For the hue angle, we always use the "in oklch shorter hue" method.
		color = {
			lightness: lightness,
			chroma: prev.chroma * (1 - proportionOfNext) + next.chroma * proportionOfNext,
			hue: (next.hue - prev.hue > 180 ? prev.hue + 360 : prev.hue) * (1 - proportionOfNext) + (next.hue - prev.hue < -180 ? next.hue + 360 : next.hue) * proportionOfNext,
			alpha: prevAlpha * (1 - proportionOfNext) + nextAlpha * proportionOfNext,
		}
	}

	// Finally, reduce chroma until the color fits in the sRGB gamut. The math for this is very complicated
	// so I'll just cheat and use a library.
	// CSS Color Module Level 4 on gamut mapping:
	// https://drafts.csswg.org/css-color/#css-gamut-mapped
	// As far as I can tell (and as far as I can see in the CSS version in this demo), browsers are currently not
	// yet using the procedure defined in that section to gamut-map colors.
	const clamped = clampChroma({ mode: "oklch", l: color.lightness, c: color.chroma, h: color.hue }, "oklch")
	return { ...color, chroma: clamped.c }
}

function createColorRampUsingChromaJs(baseColors: OklchColor[], lightnesses: number[]): OklchColor[] {
	// Sort the base colors for each ramp by lightness if they aren't already.
	baseColors.sort((a, b) => a.lightness - b.lightness)

	// Then, generate a new set of colors from the base colors.
	const gradient = chroma.scale([chroma.oklch(0, baseColors[0].chroma, baseColors[0].hue, baseColors[0].alpha), ...(baseColors.map(color => chroma.oklch(color.lightness, color.chroma, color.hue, color.alpha))), chroma.oklch(1, baseColors[baseColors.length - 1].chroma, baseColors[baseColors.length - 1].hue, baseColors[baseColors.length - 1].alpha)]).domain([0, ...(baseColors.map(color => color.lightness)), 1]).mode("oklch")
	return lightnesses.map(lightness => {
		const color = gradient(lightness).oklch()
		return { lightness: color[0], chroma: color[1], hue: color[2] }
	})
}

function createColorRampUsingCss(baseColors: OklchColor[], lightnesses: number[]): string[] {
	// Sort the base colors for each ramp by lightness if they aren't already, and then add black and white on the ends.
	baseColors.sort((a, b) => a.lightness - b.lightness)
	const sortedBaseColors = [
		{ lightness: 0, chroma: baseColors[0].chroma, hue: baseColors[0].hue, alpha: baseColors[0].alpha },
		...baseColors,
		{ lightness: 1, chroma: baseColors[baseColors.length - 1].chroma, hue: baseColors[baseColors.length - 1].hue, alpha: baseColors[baseColors.length - 1].alpha },
	]

	// Then, generate a new set of colors from the base colors.
	return lightnesses.map(lightness => createColorWithLightnessUsingCss(sortedBaseColors, lightness))
}

function createColorWithLightnessUsingCss(sortedBaseColors: readonly OklchColor[], lightness: number): string {
	// Find the darkest base color that is lighter than this one.
	let nextIndex = sortedBaseColors.findIndex(other => other.lightness > lightness)
	if (nextIndex < 0) nextIndex = sortedBaseColors.length - 1
	const prev = sortedBaseColors[nextIndex - 1]
	const next = sortedBaseColors[nextIndex]
	const proportionOfNext = (lightness - prev.lightness) / (next.lightness - prev.lightness)

	// Now let the browser do the color math for us. 
	return `color-mix(in oklch, ${oklchColorToCss(prev)}, ${oklchColorToCss(next)} ${proportionOfNext * 100}%)`
}
