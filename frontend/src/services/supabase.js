import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://izqlduvirvvfyfvivtzb.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6cWxkdXZpcnZ2Znlmdml2dHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3NTk0NjYsImV4cCI6MjA5NzMzNTQ2Nn0.sV-XcGfzB7tO0r67DxYcDoSEhBt52YC989Ai4BOutWg"

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
)