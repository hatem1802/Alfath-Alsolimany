const { createClient } = supabase
const _supabase = createClient('https://hrdqfzvhndkkcgxlzlbb.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyZHFmenZobmRra2NneGx6bGJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODI0OTY0NDQsImV4cCI6MTk5ODA3MjQ0NH0.5ihNJw8GElT1804g5Iuba8gK7oG_qKVNwzeKQsGXDzQ')

const getVisitors = async () => {
  const res = await _supabase.from('visitors').select("*").eq('id', 2)
  let visit = res?.data?.[0]
  const response = await _supabase.from('visitors').update({ 'visitors': visit?.visitors + 1 }).eq('id', visit?.id)
  return visit?.visitors + 1
}


window.addEventListener('DOMContentLoaded', () => {
  const visitorsEl = document.getElementById('visitors');
  getVisitors().then(res => {
    visitorsEl.textContent = res
  })

})