import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicBaseUrl?: string
}

export function readR2Config(environment: Record<string, string | undefined> = process.env): R2Config {
  const accountId = environment.R2_ACCOUNT_ID
  const accessKeyId = environment.R2_ACCESS_KEY_ID
  const secretAccessKey = environment.R2_SECRET_ACCESS_KEY
  const bucketName = environment.R2_BUCKET_NAME
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) throw new Error('R2 не налаштовано')
  return { accountId, accessKeyId, secretAccessKey, bucketName, publicBaseUrl: cleanBaseUrl(environment.R2_PUBLIC_BASE_URL) }
}

export function isSystemImagePath(path: string): boolean {
  return path.startsWith('system/')
}

export function publicImageUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/u, '')}/${path.split('/').map(encodeURIComponent).join('/')}`
}

export class R2Storage {
  private readonly config?: R2Config
  private readonly client?: S3Client
  private readonly publicBaseUrl?: string

  constructor(config?: R2Config) {
    this.config = config ?? optionalR2Config()
    this.publicBaseUrl = this.config?.publicBaseUrl ?? cleanBaseUrl(process.env.R2_PUBLIC_BASE_URL)
    if (this.config) this.client = new S3Client({ region: 'auto', endpoint: `https://${this.config.accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: this.config.accessKeyId, secretAccessKey: this.config.secretAccessKey } })
  }

  async createSignedUploadUrl(path: string, contentType: string, expiresIn = 900): Promise<{ path: string; signedUrl: string }> {
    const { config, client } = this.requirePrivateStorage()
    const command = new PutObjectCommand({ Bucket: config.bucketName, Key: path, ContentType: contentType })
    return { path, signedUrl: await getSignedUrl(client, command, { expiresIn }) }
  }

  async imageUrl(path: string, expiresIn = 3600): Promise<string | undefined> {
    if (this.publicBaseUrl && isSystemImagePath(path)) return publicImageUrl(this.publicBaseUrl, path)
    if (!this.config || !this.client) return undefined
    try {
      const command = new GetObjectCommand({ Bucket: this.config.bucketName, Key: path })
      return await getSignedUrl(this.client, command, { expiresIn })
    } catch { return undefined }
  }

  async upload(path: string, body: Uint8Array | Buffer, contentType: string): Promise<void> {
    const { config, client } = this.requirePrivateStorage()
    await client.send(new PutObjectCommand({ Bucket: config.bucketName, Key: path, Body: body, ContentType: contentType }))
  }

  async remove(path: string): Promise<void> {
    const { config, client } = this.requirePrivateStorage()
    await client.send(new DeleteObjectCommand({ Bucket: config.bucketName, Key: path }))
  }

  private requirePrivateStorage(): { config: R2Config; client: S3Client } {
    if (!this.config || !this.client) throw new Error('R2 не налаштовано')
    return { config: this.config, client: this.client }
  }
}

function optionalR2Config(): R2Config | undefined {
  try { return readR2Config() }
  catch { return undefined }
}

function cleanBaseUrl(value: string | undefined): string | undefined {
  return value?.trim() ? value.trim().replace(/\/+$/u, '') : undefined
}
