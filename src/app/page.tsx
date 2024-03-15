"use client"
import { useComputed, useSignal, useSignals } from "@preact/signals-react/runtime"

import type { OklchColor } from "./OklchColor"

import styles from "./page.module.css"
import Swatch from "./Swatch"

interface Ramp {
	name: string
	baseColors: [OklchColor]
}

export default function Home() {
	useSignals()
	const ramps = useSignal<Ramp[]>([
		{ name: "Blue", baseColors: [{ lightness: .57, chroma: 0.124, hue: 248 }] },
		{ name: "Red", baseColors: [{ lightness: .57, chroma: 0.2, hue: 21 }] },
	])
	const lightnesses = useSignal([ .30, .42, .47, .56, .65, .78, .90, .95, .98 ])
	const swatches = useComputed<OklchColor[][]>(() => {
		return ramps.value.map((ramp, rampIndex) => {
			// Sort the base colors for each ramp by lightness if they aren't already.
			ramp.baseColors.sort((a, b) => a.lightness - b.lightness)
			// Then, generate a new set of colors from the base colors.
			return lightnesses.value.map(lightness => createColorWithLightness(ramp.baseColors, lightness))
		})
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

function createColorWithLightness(baseColors: OklchColor[], lightness: number): OklchColor {
	// TODO: Allow 1+ base color per row, then sort by lightness and then interpolate hue and chroma along the lightness axis
	return { ...baseColors[0], lightness: lightness }
}
