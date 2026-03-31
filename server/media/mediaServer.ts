import { Router } from 'express'
import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MEDIA_DIR = path.join(__dirname, '../../media')

/** Static media router — serves files from /media/<questionId>/<filename> */
export const mediaRouter = Router()

mediaRouter.use('/', express.static(MEDIA_DIR, {
  maxAge: '1h',
  etag: true,
  setHeaders(res) {
    // Allow cross-origin access for local Ledwall and Regia clients
    res.setHeader('Access-Control-Allow-Origin', '*')
  },
}))
