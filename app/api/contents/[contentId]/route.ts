import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contentId: string }> }   // ✅ FIXED
) {
  try {
    const { contentId } = await params                     // ✅ UNWRAP

    const sql = neon(process.env.DATABASE_URL as string)

    const result = await sql`
      SELECT * FROM contents 
      WHERE id = ${contentId}
    `

    return NextResponse.json(result[0] || null)            // ✅ safer

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}