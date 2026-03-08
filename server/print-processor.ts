/**
 * Print processor module for passport photo printing.
 * Arranges processed photos for printing on standard 10×15 cm paper.
 */

import sharp from 'sharp'
import { ICAOConfig, COUNTRY_DIMENSIONS } from './validation-constants.js'

// Paper and layout constants
const PAPER_WIDTH_MM = 100
const PAPER_HEIGHT_MM = 150
const PHOTO_SPACING_MM = 6
const MIN_MARGIN_MM = 5
const BOTTOM_MARGIN_MM = 4
const LINE_SPACING_MM = 2
const TICK_LENGTH_MM = 6

// Grid layout
const GRID_COLS = 2
const GRID_ROWS = 2

// Convert mm to pixels at target DPI
function mmToPx(mm: number): number {
    return Math.floor((mm / 25.4) * ICAOConfig.targetDpi)
}

// Layout dimensions in pixels
const PAPER_WIDTH_PX = mmToPx(PAPER_WIDTH_MM)
const PAPER_HEIGHT_PX = mmToPx(PAPER_HEIGHT_MM)
const SPACING_PX = Math.max(mmToPx(PHOTO_SPACING_MM), 1)
const MIN_MARGIN_PX = mmToPx(MIN_MARGIN_MM)
const TICK_LENGTH_PX = Math.max(mmToPx(TICK_LENGTH_MM), 6)

// Calculate layout margins
function calculateLayout(photoWidthPx: number, photoHeightPx: number) {
    const totalPhotosWidth = photoWidthPx * GRID_COLS + SPACING_PX * (GRID_COLS - 1)
    const totalPhotosHeight = photoHeightPx * GRID_ROWS + SPACING_PX * (GRID_ROWS - 1)

    const marginX = Math.max(Math.floor((PAPER_WIDTH_PX - totalPhotosWidth) / 2), MIN_MARGIN_PX)
    const marginY = Math.max(Math.floor((PAPER_HEIGHT_PX - totalPhotosHeight) / 2), MIN_MARGIN_PX)

    return { marginX, marginY }
}

/**
 * Creates an SVG overlay with cutting guides and print info.
 */
function createOverlaySvg(marginX: number, marginY: number, photoWidthPx: number, photoHeightPx: number, countryCode: string, docType: string): string {
    const guideColor = '#808080'
    const guideThickness = 2
    const fontColor = '#404040'

    const lines: string[] = []

    // Draw cutting guides for each photo position
    for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
            const x0 = marginX + col * (photoWidthPx + SPACING_PX)
            const y0 = marginY + row * (photoHeightPx + SPACING_PX)
            const x1 = x0 + photoWidthPx
            const y1 = y0 + photoHeightPx

            // Top-left corner
            lines.push(`<line x1="${Math.max(x0 - TICK_LENGTH_PX, 0)}" y1="${y0}" x2="${x0}" y2="${y0}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)
            lines.push(`<line x1="${x0}" y1="${Math.max(y0 - TICK_LENGTH_PX, 0)}" x2="${x0}" y2="${y0}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)

            // Top-right corner
            lines.push(`<line x1="${x1}" y1="${y0}" x2="${Math.min(x1 + TICK_LENGTH_PX, PAPER_WIDTH_PX)}" y2="${y0}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)
            lines.push(`<line x1="${x1}" y1="${Math.max(y0 - TICK_LENGTH_PX, 0)}" x2="${x1}" y2="${y0}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)

            // Bottom-left corner
            lines.push(`<line x1="${Math.max(x0 - TICK_LENGTH_PX, 0)}" y1="${y1}" x2="${x0}" y2="${y1}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)
            lines.push(`<line x1="${x0}" y1="${y1}" x2="${x0}" y2="${Math.min(y1 + TICK_LENGTH_PX, PAPER_HEIGHT_PX)}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)

            // Bottom-right corner
            lines.push(`<line x1="${x1}" y1="${y1}" x2="${Math.min(x1 + TICK_LENGTH_PX, PAPER_WIDTH_PX)}" y2="${y1}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)
            lines.push(`<line x1="${x1}" y1="${y1}" x2="${x1}" y2="${Math.min(y1 + TICK_LENGTH_PX, PAPER_HEIGHT_PX)}" stroke="${guideColor}" stroke-width="${guideThickness}"/>`)
        }
    }

    // Add print info text at bottom
    const bottomMarginPx = mmToPx(BOTTOM_MARGIN_MM)
    const lineSpacingPx = mmToPx(LINE_SPACING_MM)
    const fontSize = Math.floor(ICAOConfig.targetDpi / 15) // Scale font with DPI

    let typeLabel = docType === 'drivers_license' ? 'Driving License' : 'Passport';
    let dimsStr = '35x45mm';

    if (countryCode && COUNTRY_DIMENSIONS[countryCode.toUpperCase()]) {
        const docKey = docType === 'drivers_license' ? 'drivers_license' : 'passport';
        const dims = COUNTRY_DIMENSIONS[countryCode.toUpperCase()][docKey];
        if (dims) {
            dimsStr = `${dims.widthMm}x${dims.heightMm}mm`;
        }
    }

    const urlText = 'www.passportphotovalidator.com'
    const infoText = `4x ${countryCode.toUpperCase()} ${typeLabel} Photos (${dimsStr}) - Cut along guides`

    const infoY = PAPER_HEIGHT_PX - bottomMarginPx
    const urlY = infoY - fontSize - lineSpacingPx

    lines.push(`<text x="${PAPER_WIDTH_PX / 2}" y="${urlY}" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="${fontColor}">${urlText}</text>`)
    lines.push(`<text x="${PAPER_WIDTH_PX / 2}" y="${infoY}" text-anchor="middle" font-family="sans-serif" font-size="${Math.floor(fontSize * 0.8)}" fill="${fontColor}">${infoText}</text>`)

    return `<svg width="${PAPER_WIDTH_PX}" height="${PAPER_HEIGHT_PX}" xmlns="http://www.w3.org/2000/svg">
    ${lines.join('\n    ')}
  </svg>`
}

export interface PrintLayoutResult {
    success: boolean
    printImage?: Buffer
    metadata?: {
        paperSizeMm: string
        photosCount: number
        paperWidthPx: number
        paperHeightPx: number
    }
    error?: string
}

/**
 * Creates a print layout with 4 passport photos arranged in a 2x2 grid
 * on 10x15cm paper with cutting guides.
 *
 * @param photoBuffer - The processed passport photo as a PNG or WebP buffer
 * @param countryCode - The target country code (e.g. 'BE', 'US')
 * @param docType - The document type ('passport' or 'drivers_license')
 * @returns PrintLayoutResult with the print-ready image
 */
export async function createPrintLayout(
    photoBuffer: Buffer,
    countryCode: string = 'BE',
    docType: string = 'passport'
): Promise<PrintLayoutResult> {
    try {

        let widthMm: number = ICAOConfig.targetPhotoWidthMm;
        let heightMm: number = ICAOConfig.targetPhotoHeightMm;

        if (countryCode && COUNTRY_DIMENSIONS[countryCode.toUpperCase()]) {
            const docKey = docType === 'drivers_license' ? 'drivers_license' : 'passport';
            const dims = COUNTRY_DIMENSIONS[countryCode.toUpperCase()][docKey];
            if (dims) {
                widthMm = dims.widthMm;
                heightMm = dims.heightMm;
            }
        }

        const photoWidthPx = mmToPx(widthMm);
        const photoHeightPx = mmToPx(heightMm);

        const { marginX, marginY } = calculateLayout(photoWidthPx, photoHeightPx)

        // Ensure the photo is the correct size
        // Flatten to white background and use PNG for strictly lossless quality
        const resizedPhoto = await sharp(photoBuffer)
            .resize(photoWidthPx, photoHeightPx, { fit: 'fill' })
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .png()
            .toBuffer()

        // Build composite operations for placing photos in a 2x2 grid
        const compositeOperations: sharp.OverlayOptions[] = []

        for (let row = 0; row < GRID_ROWS; row++) {
            for (let col = 0; col < GRID_COLS; col++) {
                const x = marginX + col * (photoWidthPx + SPACING_PX)
                const y = marginY + row * (photoHeightPx + SPACING_PX)

                compositeOperations.push({
                    input: resizedPhoto,
                    left: x,
                    top: y,
                })
            }
        }

        // Create the SVG overlay with cutting guides
        const overlaySvg = createOverlaySvg(marginX, marginY, photoWidthPx, photoHeightPx, countryCode, docType)
        const overlayBuffer = Buffer.from(overlaySvg)

        compositeOperations.push({
            input: overlayBuffer,
            left: 0,
            top: 0,
        })

        // Create white canvas and composite all elements
        const printImage = await sharp({
            create: {
                width: PAPER_WIDTH_PX,
                height: PAPER_HEIGHT_PX,
                channels: 3,
                background: { r: 255, g: 255, b: 255 },
            },
        })
            .composite(compositeOperations)
            .withMetadata({ density: 600 })
            .png()
            .toBuffer()

        return {
            success: true,
            printImage,
            metadata: {
                paperSizeMm: `${PAPER_WIDTH_MM}x${PAPER_HEIGHT_MM}`,
                photosCount: GRID_ROWS * GRID_COLS,
                paperWidthPx: PAPER_WIDTH_PX,
                paperHeightPx: PAPER_HEIGHT_PX,
            },
        }
    } catch (error) {
        console.error('Print layout creation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create print layout',
        }
    }
}
