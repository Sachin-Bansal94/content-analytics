import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL as string)
    const result = await sql`SELECT * FROM books`
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}