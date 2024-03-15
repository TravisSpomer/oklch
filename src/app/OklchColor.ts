export interface OklchColor
{
	lightness: number
	chroma: number
	hue: number
	alpha?: number
}

export function oklchColorToCss(color: OklchColor): string
{
	return `oklch(${Math.round(color.lightness * 1000) / 10}% ${color.chroma} ${color.hue}deg${(color.alpha !== 1 && color.alpha !== undefined && color.alpha !== null) ? `/ ${color.alpha}` : ""})`
}
