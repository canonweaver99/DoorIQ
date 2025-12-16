import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = "force-static";

export async function GET() {
  try {
    // Read package.json directly from node_modules since it's not exported
    const pkgPath = join(process.cwd(), 'node_modules/@elevenlabs/client/package.json')
    const pkgContent = readFileSync(pkgPath, 'utf-8')
    const pkg = JSON.parse(pkgContent)
    const version = pkg?.version ?? 'unknown'
    return NextResponse.json({ version })
  } catch (e: any) {
    // Fallback: just return a hardcoded known version or unknown
    return NextResponse.json({ version: '0.7.1 (from package.json)' })
  }
}


