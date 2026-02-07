import type { Overlay, ImageOverlay, TextOverlay } from './types';

export class OverlayManager {
	private overlays: Map<string, Overlay> = new Map();

	addImageOverlay(
		id: string,
		imageSrc: string,
		x: number = 0,
		y: number = 0,
		width: number = 200,
		height: number = 200
	): Promise<void> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.crossOrigin = 'anonymous';
			image.onload = () => {
				const overlay: ImageOverlay = {
					id,
					type: 'image',
					visible: true,
					opacity: 1,
					x,
					y,
					width,
					height,
					image
				};
				this.overlays.set(id, overlay);
				resolve();
			};
			image.onerror = () => reject(new Error(`Failed to load image: ${imageSrc}`));
			image.src = imageSrc;
		});
	}

	addTextOverlay(
		id: string,
		text: string,
		x: number = 50,
		y: number = 620,
		config?: Partial<Pick<TextOverlay, 'font' | 'color' | 'backgroundColor' | 'padding' | 'width' | 'height'>>
	): void {
		const overlay: TextOverlay = {
			id,
			type: 'text',
			visible: true,
			opacity: 1,
			x,
			y,
			width: config?.width ?? 400,
			height: config?.height ?? 60,
			text,
			font: config?.font ?? 'bold 24px sans-serif',
			color: config?.color ?? '#ffffff',
			backgroundColor: config?.backgroundColor ?? 'rgba(0, 0, 0, 0.7)',
			padding: config?.padding ?? 12
		};
		this.overlays.set(id, overlay);
	}

	updateText(id: string, text: string): void {
		const overlay = this.overlays.get(id);
		if (overlay && overlay.type === 'text') {
			(overlay as TextOverlay).text = text;
		}
	}

	show(id: string): void {
		const overlay = this.overlays.get(id);
		if (overlay) overlay.visible = true;
	}

	hide(id: string): void {
		const overlay = this.overlays.get(id);
		if (overlay) overlay.visible = false;
	}

	setOpacity(id: string, opacity: number): void {
		const overlay = this.overlays.get(id);
		if (overlay) overlay.opacity = Math.max(0, Math.min(1, opacity));
	}

	remove(id: string): void {
		this.overlays.delete(id);
	}

	render(ctx: CanvasRenderingContext2D, _canvasW: number, _canvasH: number): void {
		for (const overlay of this.overlays.values()) {
			if (!overlay.visible || overlay.opacity <= 0) continue;

			ctx.globalAlpha = overlay.opacity;

			if (overlay.type === 'image') {
				this.renderImage(ctx, overlay as ImageOverlay);
			} else if (overlay.type === 'text') {
				this.renderText(ctx, overlay as TextOverlay);
			}
		}

		ctx.globalAlpha = 1;
	}

	private renderImage(ctx: CanvasRenderingContext2D, overlay: ImageOverlay): void {
		ctx.drawImage(overlay.image, overlay.x, overlay.y, overlay.width, overlay.height);
	}

	private renderText(ctx: CanvasRenderingContext2D, overlay: TextOverlay): void {
		const { x, y, padding, text, font, color, backgroundColor } = overlay;

		// Measure text to auto-size background
		ctx.font = font;
		const metrics = ctx.measureText(text);
		const textWidth = metrics.width;
		const textHeight = parseInt(font, 10) || 24;

		const bgWidth = textWidth + padding * 2;
		const bgHeight = textHeight + padding * 2;

		// Background
		ctx.fillStyle = backgroundColor;
		ctx.fillRect(x, y, bgWidth, bgHeight);

		// Text
		ctx.fillStyle = color;
		ctx.textBaseline = 'middle';
		ctx.fillText(text, x + padding, y + bgHeight / 2);
	}

	clear(): void {
		this.overlays.clear();
	}
}
