"use client"
import { useComputed, useSignal, useSignalEffect, useSignals } from "@preact/signals-react/runtime"
import chroma, { Color } from 'chroma-js'

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
			{ lightness: 0.919, chroma: 0.192, hue: 102 },
			{ lightness: 0.662, chroma: 0.205, hue: 70 },
		] },
		{ name: "Grey", baseColors: [
			{ lightness: 0.50, chroma: 0.001, hue: 180 },
		] },
	])

	// These lightness values come from a draft color scheme I set up previously.
	// They should probably instead be calculated using gamma.
	const lightnessesString = useSignal("30%, 42%, 47%, 56%, 65%, 78%, 90%, 95%, 98%")
	const lightnesses = useSignal([ .30, .42, .47, .56, .65, .78, .90, .95, .98 ])
	useSignalEffect(() => { lightnesses.value = parseLightnesses(lightnessesString.value) || lightnesses.value })

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
			<p>This is an experiment showing how one could create perceptually uniform color ramps based on <em>multiple</em> source colors. Notice how in each color ramp, 30% appears identically bright, and so does 65%, 90%, and so on—that's definitely not the case with sRGB. This ensures that white text is always accessible on the 30% slot for a set of source colors, and black text is always accessible on the 90% slot. All this remains true with all colors and lightness values, with a notable exception: it is possible that colors can be produced outside of the gamut of sRGB. When converted to a color that can actually be shown on your display, the displayed color may no longer appear exactly as bright as its neighbors, but it should still remain accessible.</p>
			<p>This technique also allows for color ramps in which the hue is not the same across the spectrum. Notice that the "Ocean" ramp starts with a royal blue and ends with a seafoam green. This ramp also shows (at least, on an old-school monitor) an example of how colors can be generated out of gamut for sRGB—the fix for this would be to manually define a shade of green within the sRGB gamut with a very high luminance instead of having the algorithm extrapolate one.</p>
			<h3>Custom colors</h3>
			<label>
				Enter one or more hex colors (1234ab), separated by commas:
				<br />
				<input type="text" value={colorsString.value} onChange={ev => colorsString.value = ev.target.value} size={80} />
			</label>
			<button type="button" onClick={addColorPalette}>Add</button>
			<p>Note that when specifying a single, saturated custom color, the lighter end of your color ramp will likely include colors that your monitor can't display properly. Avoid this by including a lighter, desaturated version of the same color. (I need to develop a technique for lowering chroma until the color is in sRGB gamut.)</p>
			<h3>Lightness ramp</h3>
			<label>
				Enter one or more lightness percentages, 0-100, separated by commas:
				<br />
				<input type="text" value={lightnessesString.value} onChange={ev => lightnessesString.value = ev.target.value} size={80} />
			</label>
			<h2>My basic math version</h2>
			<p>My very basic algorithm is not correct because OKLCH is a cylindrical space but I'm doing linear math. But... it seems very close to chroma.js's results... 🤔</p>
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
			<p>They have <a href="https://gka.github.io/chroma.js/#color-scales" target="_blank">built-in support for color scales</a> but I like my math and the pure CSS versions better visually.</p>
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
			<p><code>color-mix()</code> will do the work for us!</p>
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
	
	function addColorPalette() {
		try {
			const colorStrings = colorsString.value.split(",").map(string => string.trim()).filter(string => !!string)
			const colors = colorStrings.filter(string => chroma.valid(string)).map(string => chroma(string)).map(chromaColorToOurs)
			if (colors.length < 1) return

			ramps.value = [...ramps.value, { name: "Custom", baseColors: colors }]
			colorsString.value = ""
		}
		catch (ex) {
			console.error(ex)
			return
		}
	}
}

function chromaColorToOurs(color: Color): OklchColor {
	const oklch = color.oklch()
	return { lightness: oklch[0], chroma: oklch[1], hue: oklch[2] }
}

function parseLightnesses(input: string): number[] | null {
	try {
		const percentStrings = input.split(",").map(string => string.trim()).filter(string => !!string)
		const numbers = percentStrings.map(string => parseInt(string, 10)).filter(number => !isNaN(number)).map(number => number < 0 ? 0 : number > 100 ? 1 : number / 100)
		numbers.sort()
		return numbers.length ? numbers : [.50]
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

	// Otherwise, figure out where this new color lies in the spectrum.
	if (stopsCount === 1 || lightness <= sortedBaseColors[0].lightness)
	{
		// Darker than all base colors, or there's only one base color anyway
		return { ...sortedBaseColors[0], lightness: lightness }
	}
	else if (lightness >= sortedBaseColors[stopsCount - 1].lightness)
	{
		// Lighter than all base colors
		return { ...sortedBaseColors[stopsCount - 1], lightness: lightness }
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
		return {
			lightness: lightness,
			chroma: prev.chroma * (1 - proportionOfNext) + next.chroma * proportionOfNext,
			hue: (next.hue - prev.hue > 180 ? prev.hue + 360 : prev.hue) * (1 - proportionOfNext) + (next.hue - prev.hue < -180 ? next.hue + 360 : next.hue) * proportionOfNext,
			alpha: prevAlpha * (1 - proportionOfNext) + nextAlpha * proportionOfNext,
		}
	}
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
