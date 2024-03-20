export default function config(phase) {
	return /** @type {import("next").NextConfig} */ {
		output: "export",
		basePath: phase === "phase-development-server" ? "" : "/oklch",
		images: {
			unoptimized: true,
		},
	}
}
