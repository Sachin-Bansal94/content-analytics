export function getUserId(): string {
  if (typeof window === 'undefined') return 'server'
  
  let userId = localStorage.getItem('user_id')
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('user_id', userId)
  }
  return userId
}