# 🚀 Deployment Guide

## Option 1: GitHub Pages (Recommended)

1. Go to your repository on GitHub: `https://github.com/masterMo66/snake-game`
2. Click **Settings** → **Pages**
3. Under **Source**, select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait a few minutes for deployment
6. Your game will be available at: `https://masterMo66.github.io/snake-game`

### Custom Domain (snake.moqi.chat)
1. In GitHub Pages settings, add `snake.moqi.chat` to the **Custom domain** field
2. Update DNS records at your domain registrar:
   ```
   Type: CNAME
   Name: snake
   Value: masterMo66.github.io
   TTL: 3600
   ```
3. Wait for DNS propagation (up to 24 hours)
4. Enable **Enforce HTTPS** in GitHub Pages settings

## Option 2: Manual Server Deployment

### Prerequisites
- SSH access to your server
- Nginx installed
- Domain configured (snake.moqi.chat)

### Steps
1. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

2. Follow the instructions to:
   - Copy Nginx configuration
   - Set up SSL with Let's Encrypt
   - Reload Nginx

3. Your game will be available at: `https://snake.moqi.chat`

## Option 3: Netlify (Alternative)

1. Sign up at [Netlify](https://netlify.com)
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `.`
4. Add custom domain: `snake.moqi.chat`
5. Deploy!

## Option 4: Vercel

1. Sign up at [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure project:
   - Framework Preset: Static
   - Output Directory: `.`
4. Add domain: `snake.moqi.chat`
5. Deploy!

## 📊 Deployment Status

| Service | Status | URL |
|---------|--------|-----|
| GitHub Pages | ✅ Ready | `https://masterMo66.github.io/snake-game` |
| Custom Domain | ⚠️ Needs DNS | `https://snake.moqi.chat` |
| Netlify | 🔄 Not deployed | - |
| Vercel | 🔄 Not deployed | - |

## 🔧 Troubleshooting

### GitHub Pages not updating
- Check GitHub Actions workflow status
- Ensure `CNAME` file is in root directory
- Verify branch is set to `main`

### Custom domain not working
- Check DNS propagation: `dig snake.moqi.chat`
- Verify CNAME record points to `masterMo66.github.io`
- Wait up to 24 hours for DNS changes

### SSL/HTTPS issues
- Ensure "Enforce HTTPS" is enabled in GitHub Pages
- For manual deployment, run: `sudo certbot --nginx -d snake.moqi.chat`

## 📞 Support

If you encounter issues:
1. Check GitHub Actions logs
2. Verify DNS configuration
3. Contact your hosting provider
4. Open an issue on GitHub