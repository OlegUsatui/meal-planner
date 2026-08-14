import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const r2AccountId = process.env.R2_ACCOUNT_ID
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const r2BucketName = process.env.R2_BUCKET_NAME
if (!supabaseUrl || !serviceRoleKey || !r2AccountId || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) throw new Error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME before migrating.')

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
const r2 = new S3Client({ region: 'auto', endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: r2AccessKeyId, secretAccessKey: r2SecretAccessKey } })

const { data: recipes, error: recipesError } = await supabase.from('recipes').select('id,image_path,image_mime_type')
if (recipesError) throw new Error(`Could not read recipes: ${recipesError.message}`)

let migrated = 0
for (const recipe of recipes ?? []) {
  const { data, error } = await supabase.storage.from('recipe-images').download(recipe.image_path)
  if (error || !data) throw new Error(`Could not download ${recipe.image_path}: ${error?.message ?? 'empty response'}`)
  const body = new Uint8Array(await data.arrayBuffer())
  try {
    await r2.send(new PutObjectCommand({ Bucket: r2BucketName, Key: recipe.image_path, Body: body, ContentType: recipe.image_mime_type ?? 'image/webp' }))
  } catch (uploadError) {
    throw new Error(`Could not upload ${recipe.image_path}: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`)
  }
  migrated += 1
  console.log(`Migrated ${migrated}/${recipes.length}: ${recipe.id}`)
}
console.log(`R2 migration complete. Images migrated: ${migrated}`)
