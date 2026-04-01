import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }   // ✅ FIXED TYPE
) {
  try {
    const { bookId } = await params                     // ✅ UNWRAP PARAMS

    const sql = neon(process.env.DATABASE_URL as string)

    const result = await sql`
      SELECT * FROM chapters 
      WHERE book_id = ${bookId} 
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