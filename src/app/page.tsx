"use client"
import { useComputed, useSignal, useSignals } from "@preact/signals-react/runtime"

import type { OklchColor } from "./OklchColor"

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
		{ name: "RGB", baseColors: [
			{ lightness: .05, chroma: 0.100, hue: 15},
			{ lightness: .75, chroma: 0.167, hue: 135 },
			{ lightness: .95, chroma: 0.200, hue: 250 },
		] },
	])
	const lightnesses = useSignal([ .30, .42, .47, .56, .65, .78, .90, .95, .98 ])
	const swatches = useComputed<OklchColor[][]>(() => {
		return ramps.value.map(ramp => createColorRamp(ramp.baseColors, lightnesses.value))
	})

	return (
		<main className={styles.main}>
			<p><em>(The UI is that you edit the code)</em></p>
			<table>
				<thead>
					<tr>
						<th></th>
						{lightnesses.value.map((lightness, index) => <th key={index}>{Math.round(lightness * 1000) / 10}</th>)}
					</tr>
				</thead>
				<tbody>
					{swatches.value.map((row, rowIndex) => <tr key={rowIndex}>
						<th>{ramps.value[rowIndex].name}</th>
						{row.map((color, colorIndex) => <td key={colorIndex}><Swatch color={color} /></td>)}
					</tr>)}
				</tbody>
			</table>
		</main>
	);
}

function createColorRamp(baseColors: OklchColor[], lightnesses: number[]): OklchColor[] {
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
		return {
			lightness: lightness,
			chroma: prev.chroma * (1 - proportionOfNext) + next.chroma * proportionOfNext,
			hue: prev.hue * (1 - proportionOfNext) + next.hue * proportionOfNext, // TODO: support hue wrapping around red/0deg ***
			alpha: prevAlpha * (1 - proportionOfNext) + nextAlpha * proportionOfNext,
		}
	}
}
