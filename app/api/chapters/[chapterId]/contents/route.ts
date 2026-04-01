import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ chapterId: string }> }   // ✅ FIXED
) {
  try {
    const { chapterId } = await params                     // ✅ UNWRAP

    const sql = neon(process.env.DATABASE_URL as string)

    const result = await sql`
      SELECT * FROM contents 
      WHERE chapter_id = ${chapterId} 
      ORDER BY order_index ASC
    `

    return NextResponse.json(result)

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}