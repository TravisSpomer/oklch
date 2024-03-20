import type { OklchColor } from "./OklchColor"
import { oklchColorToCss } from "./OklchColor"
import styles from "./Swatch.module.css"

interface SwatchProps {
	color: OklchColor | string
}

export default function swatch(props: SwatchProps) {
	return <div className={`${styles.swatch} ${typeof props.color !== "string" ? (props.color.lightness < 0.80 ? styles.dark : styles.light) : ""}`} style={{ backgroundColor: typeof props.color === "string" ? props.color : oklchColorToCss(props.color) }}>
		{typeof props.color !== "string" && <div className={styles.content}>
			<span className={styles.label}>L</span>
			<span>{Math.round(props.color.lightness * 1000) / 10}%</span>
			<span className={styles.label}>C</span>
			<span>{Math.round(props.color.chroma * 100) / 100}</span>
			<span className={styles.label}>H</span>
			<span>{Math.round(props.color.hue)}°</span>
		</div>}
	</div>
}
