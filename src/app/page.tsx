"use client"
import { useComputed, useSignal, useSignals } from "@preact/signals-react/runtime"
import chroma from 'chroma-js'

import { oklchColorToCss, type OklchColor } from "./OklchColor"

import styles from "./page.module.css"
import Swatch from "./Swatch"

interface Ramp {
	name: string
	baseColors: OklchColor[]
}

export default function Home() {
	useSignals() // NOTE: These don't actually need to be signals since they never change; I was just trying out the library.

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
			{ lightness: 0.00, chroma: 0.124, hue: 250 },
			{ lightness: 1.00, chroma: 0.050, hue: 160 },
		] },
		{ name: "Bloom", baseColors: [
			{ lightness: .344, chroma: 0.091, hue: 13.5},
			{ lightness: .737, chroma: 0.188, hue: 337},
			{ lightness: .980, chroma: 0.014, hue: 337 },
		] },
		{ name: "Grey", baseColors: [
			{ lightness: 0.50, chroma: 0.001, hue: 180 },
		] },
		/*{ name: "ugly RGB", baseColors: [
			{ lightness: .050, chroma: 0.100, hue: 15},
			{ lightness: .750, chroma: 0.167, hue: 135 },
			{ lightness: .950, chroma: 0.033, hue: 250 },
		] },*/
	])

	// These lightness values come from a draft color scheme I set up previously.
	// They should probably instead be calculated using gamma.
	const lightnesses = useSignal([ .30, .42, .47, .56, .65, .78, .90, .95, .98 ])

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
			<p><em>(To edit the color ramps, edit the code)</em></p>
			<h1>My basic math version</h1>
			<p>My very basic algorithm is not correct because OKLCH is a cylindrical space but I'm doing linear math. But... it seems very close to chroma.js's results... 🤔 ("Bloom" doesn't work because I'm not wrapping hue correctly.)</p>
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
			<h1>A version using chroma.js</h1>
			<p>They have <a href="https://gka.github.io/chroma.js/#color-scales" target="_blank">built-in support for this stuff</a> that's going to be way better than my code.</p>
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
			<h1>A version using pure CSS</h1>
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
	);
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
	const nextIndex = sortedBaseColors.findIndex(other => other.lightness > lightness)
	const prev = sortedBaseColors[nextIndex - 1]
	const next = sortedBaseColors[nextIndex]
	const proportionOfNext = (lightness - prev.lightness) / (next.lightness - prev.lightness)

	// Now let the browser do the color math for us. 
	return `color-mix(in oklch, ${oklchColorToCss(prev)}, ${oklchColorToCss(next)} ${proportionOfNext * 100}%)`
}
